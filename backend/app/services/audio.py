"""Audio conversion and segmentation service using bundled ffmpeg."""

import os
import glob
import tempfile
import asyncio
import logging
import subprocess
from app.errors import AppError

logger = logging.getLogger("interviewiq.audio")


def segment_audio(total_duration_sec: float, max_chunk_sec: float = 28.0) -> list[tuple[float, float]]:
    """Returns (start, duration) ranges covering the audio without exceeding the chunk limit."""
    if total_duration_sec <= 0 or max_chunk_sec <= 0:
        return []

    chunks = []
    start = 0.0
    while start < total_duration_sec:
        duration = min(max_chunk_sec, total_duration_sec - start)
        chunks.append((start, duration))
        start += duration
    return chunks


def _get_ffmpeg_binary() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def _run_ffmpeg(args: list[str]) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        [_get_ffmpeg_binary(), *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


async def probe_duration_sec(data: bytes) -> float:
    """Probes the duration in seconds of audio bytes."""
    if not data or len(data) < 32:
        raise AppError(422, "AUDIO_TOO_SHORT", "Audio payload is too small.")

    with tempfile.NamedTemporaryFile(suffix=".tmp", delete=False) as tmp_in:
        tmp_in.write(data)
        in_path = tmp_in.name

    try:
        proc = await asyncio.to_thread(_run_ffmpeg, ["-i", in_path])
        stderr_str = proc.stderr.decode(errors="ignore")

        # Parse "Duration: 00:01:23.45"
        if "Duration:" in stderr_str:
            dur_line = [l for l in stderr_str.split("\n") if "Duration:" in l][0]
            dur_part = dur_line.split("Duration:")[1].split(",")[0].strip()
            try:
                h, m, s = dur_part.split(":")
                return float(h) * 3600 + float(m) * 60 + float(s)
            except ValueError:
                logger.debug("Could not parse ffmpeg duration %r; estimating from payload size.", dur_part)

        # Fallback to approximate duration based on file size if probe fails
        return max(1.0, len(data) / 32000.0)

    except OSError as err:
        logger.warning("ffmpeg probe failed: %s", err)
        return max(1.0, len(data) / 32000.0)
    finally:
        if os.path.exists(in_path):
            try:
                os.remove(in_path)
            except OSError:
                pass


async def to_wav_chunks(data: bytes, max_chunk_sec: int = 28) -> list[bytes]:
    """Converts input audio (WebM, MP3, etc.) to 16 kHz mono WAV and segments into <=max_chunk_sec chunks."""
    if not data or len(data) < 100:
        raise AppError(422, "INVALID_AUDIO", "Empty or truncated audio recording received.")

    temp_dir = tempfile.mkdtemp(prefix="iq_audio_")
    in_path = os.path.join(temp_dir, "input.raw")
    out_pattern = os.path.join(temp_dir, "chunk_%03d.wav")

    with open(in_path, "wb") as f:
        f.write(data)

    try:
        # Convert to 16 kHz, 1 channel, 16-bit PCM WAV and segment
        proc = await asyncio.to_thread(
            _run_ffmpeg,
            [
                "-y",
                "-i", in_path,
                "-ar", "16000",
                "-ac", "1",
                "-c:a", "pcm_s16le",
                "-f", "segment",
                "-segment_time", str(max_chunk_sec),
                out_pattern,
            ],
        )

        if proc.returncode != 0:
            err_log = proc.stderr.decode(errors="ignore")
            logger.error("ffmpeg conversion error: %s", err_log)
            raise AppError(422, "INVALID_AUDIO", "Could not decode audio recording.")

        chunk_files = sorted(glob.glob(os.path.join(temp_dir, "chunk_*.wav")))
        if not chunk_files:
            raise AppError(422, "INVALID_AUDIO", "No valid audio chunks produced.")

        chunks = []
        for cf in chunk_files:
            with open(cf, "rb") as f:
                chunks.append(f.read())

        return chunks

    except OSError as err:
        logger.exception("Could not start ffmpeg audio conversion.")
        raise AppError(
            503,
            "AUDIO_PROCESSING_UNAVAILABLE",
            "Audio processing is unavailable on the server.",
        ) from err
    finally:
        for f in glob.glob(os.path.join(temp_dir, "*")):
            try:
                os.remove(f)
            except OSError:
                pass
        try:
            os.rmdir(temp_dir)
        except OSError:
            pass


async def get_audio_duration_sec(data: bytes) -> float:
    """Compatibility wrapper for callers using the original audio helper name."""
    return await probe_duration_sec(data)


async def prepare_audio_for_stt(data: bytes, max_chunk_sec: int = 28) -> list[bytes]:
    """Compatibility wrapper for callers preparing audio for speech recognition."""
    return await to_wav_chunks(data, max_chunk_sec=max_chunk_sec)
