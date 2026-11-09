"""Self-contained end-to-end voice loop test.

Synthesizes a candidate answer with Timbre TTS and sends the resulting audio
through the full /sessions -> /answer -> /end -> /report pipeline without requiring a microphone.
"""

import asyncio
import os
import sys
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
from app.services.gnani_tts import GnaniTTS


async def main():
    settings = get_settings()
    base_url = os.getenv("API_URL", "http://localhost:8000")

    print("==================================================")
    print(" InterviewIQ AI — End-to-End Voice Loop Test")
    print(f" Target API: {base_url}")
    print("==================================================")

    if not settings.GNANI_API_KEY:
        print("[WARNING] GNANI_API_KEY is not configured; synthesizing with local tone fallback.")

    tts = GnaniTTS()
    sample_speech = (
        "A process is an independent program in execution with its own private virtual memory space, "
        "while a thread is a lightweight unit of execution within a process that shares memory and resources. "
        "Context switching between processes has higher overhead because it requires invalidating the TLB cache."
    )

    print("\n[Step 1] Synthesizing candidate voice answer via Gnani Timbre TTS...")
    try:
        audio_bytes = await tts.synthesize(sample_speech, language="en")
        print(f"Synthesized {len(audio_bytes)} bytes of speech audio.")
    except Exception as e:
        print(f"TTS synthesis failed or key not available ({e}). Creating fallback audio with ffmpeg.")
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-f", "lavfi", "-i", "sine=frequency=800:duration=4", "-ar", "16000", "-ac", "1", "-f", "wav", "-",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        audio_bytes, _ = await proc.communicate()

    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Start Session
        print("\n[Step 2] POST /api/sessions (Technical, Concurrency, 5m)...")
        start_payload = {
            "type": "technical",
            "domain": "Operating Systems & Concurrency",
            "difficulty": "intermediate",
            "durationMin": 5,
            "language": "en",
        }
        res = await client.post(f"{base_url}/api/sessions", json=start_payload)
        if res.status_code != 200:
            print(f"FAILED to start session: {res.status_code} {res.text}")
            sys.exit(1)

        start_data = res.json()
        session_id = start_data["sessionId"]
        question_id = start_data["firstQuestion"]["id"]
        question_text = start_data["firstQuestion"]["text"]
        print(f"Started session {session_id}")
        print(f"Question: \"{question_text}\"")

        # 2. Submit Answer
        print(f"\n[Step 3] POST /api/sessions/{session_id}/answer with audio...")
        files = {
            "audio": ("candidate_answer.wav", audio_bytes, "audio/wav"),
        }
        data = {
            "questionId": question_id,
        }
        res = await client.post(f"{base_url}/api/sessions/{session_id}/answer", data=data, files=files)
        if res.status_code != 200:
            print(f"FAILED to submit answer: {res.status_code} {res.text}")
            sys.exit(1)

        answer_data = res.json()
        print(f"Transcript: \"{answer_data['transcript']}\"")
        eval_data = answer_data["evaluation"]
        print(f"Score: {eval_data['overall']}/100")
        print(f"Strengths: {eval_data['strengths']}")
        print(f"Improvements: {eval_data['improvements']}")
        if answer_data.get("nextQuestion"):
            print(f"Next Question: \"{answer_data['nextQuestion']['text']}\"")
            print(f"Audio URL: {answer_data['nextQuestion'].get('audioUrl')}")

        # 3. End Session
        print(f"\n[Step 4] POST /api/sessions/{session_id}/end...")
        res = await client.post(f"{base_url}/api/sessions/{session_id}/end")
        if res.status_code != 200:
            print(f"FAILED to end session: {res.status_code} {res.text}")
            sys.exit(1)
        print("Session ended successfully.")

        # 4. Fetch Report
        print(f"\n[Step 5] GET /api/sessions/{session_id}/report...")
        res = await client.get(f"{base_url}/api/sessions/{session_id}/report")
        if res.status_code != 200:
            print(f"FAILED to get report: {res.status_code} {res.text}")
            sys.exit(1)

        report = res.json()
        print(f"Report Overall Score: {report['overallScore']}/100")
        print(f"Summary Feedback: \"{report['summaryFeedback']}\"")
        print(f"Study Plan Items: {len(report['studyPlan'])}")

    print("\n=== End-to-end voice loop passed successfully! ===")


if __name__ == "__main__":
    asyncio.run(main())
