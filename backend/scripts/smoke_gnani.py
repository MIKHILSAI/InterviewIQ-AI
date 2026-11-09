"""Smoke test verifying Gnani Prisma STT and Timbre TTS connectivity."""

import asyncio
import os
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
from app.services.gnani_tts import GnaniTTS
from app.services.gnani_stt import GnaniSTT


async def main():
    settings = get_settings()
    print("=== InterviewIQ AI: Gnani Services Smoke Test ===")
    print(f"API Key present: {'Yes (' + settings.GNANI_API_KEY[:6] + '...)' if settings.GNANI_API_KEY else 'No'}")
    print(f"TTS URL: {settings.GNANI_TTS_URL}")
    print(f"STT URL: {settings.GNANI_STT_URL}")

    if not settings.GNANI_API_KEY:
        print("\n[WARNING] GNANI_API_KEY is not set. Exiting smoke test safely.")
        return

    tts = GnaniTTS()
    test_phrase = "Welcome to InterviewIQ AI. This is a voice diagnostic check."

    print(f"\n1. Synthesizing test audio: '{test_phrase}'...")
    try:
        audio_bytes = await tts.synthesize(test_phrase, language="en")
        print(f"   [SUCCESS] Received {len(audio_bytes)} bytes of WAV audio.")
    except Exception as e:
        print(f"   [FAILED] TTS error: {e}")
        return

    print("\n2. Transcribing synthesized audio via Gnani Prisma STT...")
    stt = GnaniSTT()
    try:
        transcript = await stt.transcribe_chunk(audio_bytes, language="en", keyterms=["InterviewIQ", "diagnostic"])
        print(f"   [SUCCESS] Transcription output: '{transcript}'")
    except Exception as e:
        print(f"   [FAILED] STT error: {e}")
        return

    print("\n=== Smoke test completed successfully! ===")


if __name__ == "__main__":
    asyncio.run(main())
