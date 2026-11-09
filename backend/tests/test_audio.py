import io
import wave

import pytest

from app.services.audio import probe_duration_sec, to_wav_chunks


def make_test_wav() -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as audio_file:
        audio_file.setnchannels(1)
        audio_file.setsampwidth(2)
        audio_file.setframerate(16000)
        audio_file.writeframes(b"\0\0" * 16000)
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_ffmpeg_audio_processing_works_with_asyncio_loop():
    audio = make_test_wav()

    duration = await probe_duration_sec(audio)
    chunks = await to_wav_chunks(audio)

    assert duration == pytest.approx(1.0, abs=0.1)
    assert len(chunks) == 1
    assert chunks[0].startswith(b"RIFF")
