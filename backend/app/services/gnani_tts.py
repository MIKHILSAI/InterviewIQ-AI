"""Gnani Timbre Text-to-Speech (TTS) v2.5 client with text normalization."""

import re
import random
import asyncio
import logging
import httpx

from app.config import get_settings
from app.errors import AppError
from app.schemas import Language

logger = logging.getLogger("interviewiq.tts")

# Separate shared semaphore for TTS requests
_tts_semaphore = asyncio.Semaphore(1)


def prepare_spoken_text(text: str) -> str:
    """Normalizes raw question or feedback text into natural spoken narration."""
    # Strip markdown code blocks and backticks
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)

    # Strip markdown headings and bullet asterisks
    text = re.sub(r"[#*_\~]+", "", text)

    # Symbol replacements
    text = text.replace("->", " to ")
    text = text.replace("&", " and ")
    text = text.replace("/", " or ")
    text = text.replace("@", " at ")

    # Normalize whitespace
    text = " ".join(text.split())

    # Truncate at sentence boundary if exceeding 600 characters
    if len(text) > 600:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        clipped = []
        curr_len = 0
        for s in sentences:
            if curr_len + len(s) > 580:
                break
            clipped.append(s)
            curr_len += len(s) + 1
        text = " ".join(clipped) if clipped else text[:580]

    return text.strip()


class GnaniTTS:
    """Client for Gnani Timbre TTS v2.5 REST API."""

    def __init__(self):
        self.settings = get_settings()
        self.client = httpx.AsyncClient(timeout=45.0)

    def _select_voice_and_lang(self, language: Language) -> tuple[str, str]:
        if language == "ta":
            return self.settings.VOICE_TA, "ta-IN"
        elif language == "hi":
            return self.settings.VOICE_HI, "hi-IN"
        return self.settings.VOICE_EN, "en-IN"

    async def synthesize(self, text: str, language: Language = "en") -> bytes:
        """Synthesizes text into WAV bytes using Gnani Timbre."""
        spoken_text = prepare_spoken_text(text)
        if not spoken_text:
            raise AppError(422, "INVALID_TTS_INPUT", "Text cannot be empty for synthesis.")

        voice, lang_code = self._select_voice_and_lang(language)

        headers = {
            "X-API-Key-ID": self.settings.GNANI_API_KEY,
            "Content-Type": "application/json",
        }

        payload = {
            "text": spoken_text,
            "voice": voice,
            "model": self.settings.TTS_MODEL,
            "language": lang_code,
            "speed": self.settings.TTS_SPEED,
            "audio_config": {
                "sample_rate": self.settings.TTS_SAMPLE_RATE,
                "num_channels": 1,
                "sample_width": 2,
                "encoding": "linear_pcm",
                "container": "wav",
            },
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with _tts_semaphore:
                    resp = await self.client.post(
                        self.settings.GNANI_TTS_URL,
                        headers=headers,
                        json=payload,
                    )

                if resp.status_code == 200:
                    return resp.content

                if resp.status_code == 429 or resp.status_code in (500, 502, 503):
                    if attempt < max_retries - 1:
                        backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning("Gnani TTS returned %s. Retrying in %.2fs (attempt %d/%d)", resp.status_code, backoff, attempt + 1, max_retries)
                        await asyncio.sleep(backoff)
                        continue

                logger.error("Gnani TTS error [%s]: %s", resp.status_code, resp.text[:200])
                raise AppError(502, "TTS_FAILED", "Text-to-speech synthesis failed.")

            except (httpx.TimeoutException, httpx.NetworkError) as err:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.0 + attempt)
                    continue
                logger.error("Gnani TTS network error: %s", err)
                raise AppError(502, "TTS_FAILED", "Speech synthesis service timeout.") from err

        raise AppError(502, "TTS_FAILED", "Text-to-speech failed after retries.")

    async def synthesize_safe(self, text: str, language: Language = "en") -> bytes | None:
        """Non-fatal audio synthesis helper. Returns None on failure so caller can fall back to browser TTS."""
        if not self.settings.GNANI_API_KEY:
            return None
        try:
            return await self.synthesize(text, language)
        except Exception as err:
            logger.warning("TTS synthesize_safe suppressed error: %s", err)
            return None
