"""Gnani Prisma Speech-to-Text (STT) client with chunking and rate-limit serialization."""

import re
import json
import random
import asyncio
import logging
from dataclasses import dataclass
import httpx

from app.config import get_settings
from app.errors import AppError
from app.schemas import Language
from app.services.audio import to_wav_chunks, probe_duration_sec

logger = logging.getLogger("interviewiq.stt")

# Shared process-wide semaphore for accounts limited to 1 concurrent request
_stt_semaphore = asyncio.Semaphore(1)


@dataclass
class SttResult:
    transcript: str
    duration_sec: float


class GnaniSTT:
    """Client for Gnani Prisma STT v2.5 / v3.0 REST API."""

    def __init__(self):
        self.settings = get_settings()
        self.client = httpx.AsyncClient(timeout=60.0)

    def _sanitize_bias_list(self, terms: list[str] | None) -> list[str]:
        """Sanitizes keyterms into single alphabetic words, max 100 items."""
        if not terms:
            return []
        sanitized = set()
        for term in terms:
            for word in re.findall(r"[a-zA-Z]+", term):
                if len(word) >= 2:
                    sanitized.add(word.lower())
        return list(sanitized)[:100]

    async def _transcribe_chunk(
        self,
        chunk_wav: bytes,
        language: Language,
        keyterms: list[str] | None,
        request_id: str,
    ) -> str:
        """Sends one <=28s WAV chunk to Gnani Prisma with retry backoff."""
        lang_map: dict[Language, str] = {
            "en": "en-IN",
            "ta": "ta-IN",
            "hi": "hi-IN",
        }
        lang_code = lang_map.get(language, "en-IN")

        headers = {
            "X-API-Key-ID": self.settings.GNANI_API_KEY,
            "X-API-Request-ID": request_id,
        }

        # Handle Tamil code-mixing format for Prisma v3.0
        data_fields: dict[str, str] = {
            "language_code": "ta-IN,en-IN" if language == "ta" and self.settings.STT_MODEL == "prisma-v3.0" else lang_code,
        }
        if self.settings.STT_MODEL:
            data_fields["model"] = self.settings.STT_MODEL

        # Bias list or keyterms
        if self.settings.STT_BIAS_ENABLED and keyterms:
            if self.settings.STT_MODEL == "prisma-v3.0":
                data_fields["keyterms"] = json.dumps(keyterms[:200])
                if language == "ta":
                    data_fields["format"] = "codemix"
            else:
                bias_words = self._sanitize_bias_list(keyterms)
                if bias_words:
                    data_fields["bias_list"] = json.dumps(bias_words)
                    data_fields["bias_score"] = "1.0"
                    data_fields["format"] = "verbatim"

        files = {
            "audio_file": ("chunk.wav", chunk_wav, "audio/wav"),
        }

        # Retry loop for rate limits (429) and upstream timeouts (5xx)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with _stt_semaphore:
                    resp = await self.client.post(
                        self.settings.GNANI_STT_URL,
                        headers=headers,
                        data=data_fields,
                        files=files,
                    )

                if resp.status_code == 200:
                    result = resp.json()
                    return result.get("transcript", "").strip()

                if resp.status_code == 429 or resp.status_code in (500, 502, 503, 504):
                    if attempt < max_retries - 1:
                        backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning("Gnani STT returned %s. Retrying in %.2fs (attempt %d/%d)", resp.status_code, backoff, attempt + 1, max_retries)
                        await asyncio.sleep(backoff)
                        continue

                # Unrecoverable error mapping
                if resp.status_code in (401, 403):
                    raise AppError(502, "STT_AUTH", "Speech service credentials are invalid.")
                elif resp.status_code == 402:
                    raise AppError(502, "STT_CREDITS", "Speech service account has insufficient credits.")
                elif resp.status_code == 429:
                    raise AppError(503, "STT_BUSY", "Speech service is busy. Please try again.")

                err_json = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_type = err_json.get("error", {}).get("type", "UNKNOWN")
                logger.error("Gnani STT error [%s] %s: %s", resp.status_code, err_type, err_json)

                if err_type in ("EMPTY_AUDIO", "UNSUPPORTED_AUDIO_FORMAT", "AUDIO_CONVERSION_ERROR"):
                    raise AppError(422, "INVALID_AUDIO", "The recorded audio format is invalid.")

                raise AppError(502, "STT_FAILED", "Speech recognition failed. Please try again.")

            except (httpx.TimeoutException, httpx.NetworkError) as net_err:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.0 + attempt)
                    continue
                logger.error("Gnani STT network error: %s", net_err)
                raise AppError(502, "STT_FAILED", "Speech service network timeout.") from net_err

        return ""

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Language,
        keyterms: list[str] | None = None,
        request_id: str = "req_stt",
    ) -> SttResult:
        """Converts audio, transcribes chunks sequentially, and concatenates transcripts."""
        duration_sec = await probe_duration_sec(audio_bytes)
        chunks = await to_wav_chunks(audio_bytes, max_chunk_sec=28)
        transcript = await self.transcribe_chunks(chunks, language, keyterms, request_id)
        return SttResult(transcript=transcript, duration_sec=duration_sec)

    async def transcribe_chunks(
        self,
        chunks: list[bytes],
        language: Language,
        keyterms: list[str] | None = None,
        request_id: str = "req_stt",
    ) -> str:
        """Transcribes already-converted WAV chunks sequentially."""
        transcripts = []
        for i, chunk in enumerate(chunks):
            chunk_req_id = f"{request_id}_{i}"
            part = await self._transcribe_chunk(chunk, language, keyterms, chunk_req_id)
            if part:
                transcripts.append(part)

        return " ".join(transcripts).strip()
