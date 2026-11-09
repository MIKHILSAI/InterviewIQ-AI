# InterviewIQ AI — FastAPI Voice Backend

InterviewIQ AI is an adaptive mock interview platform that conducts realistic spoken interviews with multi-turn reasoning and native Indian English and Tamil voice synthesis.

---

## Architecture Diagram: `/answer` Pipeline

```
+----------------------------------------------------------------------------------------------------+
|                                    Candidate Voice Turn Pipeline                                   |
+----------------------------------------------------------------------------------------------------+

 Browser Audio (WebM/Opus)
          │
          ▼
 [ 1. Audio Conversion ] (~0.1s - 0.3s)
   - Read multipart stream
   - FFmpeg convert to 16 kHz Mono PCM WAV
   - Segment into <=28s chunks (Prisma 30s limit)
          │
          ▼
 [ 2. Speech-to-Text: Gnani Prisma STT ] (~1.5s - 2.8s)
   - Async POST to https://api.vachana.ai/stt/v3
   - Inject keyword biasing from current expected concepts
   - Extract raw candidate transcript
          │
          ▼
 [ 3. Interview Engine & LLM Evaluation (Groq openai/gpt-oss-20b) ] (~0.4s - 1.2s)
   - Compute WPM & filler pauses (um, uh, basically, etc.)
   - Evaluate against 5 weighted rubric dimensions
   - Adaptive decision: follow_up, next_topic, or finish
   - Strictly wrapped in <candidate_answer> tags
          │
          ▼
 [ 4. Text-to-Speech: Gnani Timbre TTS ] (~0.8s - 1.8s)
   - Normalize question text (strip code/markdown)
   - Timbre v2.5 voice synthesis (Kaveri / Vedika)
   - Save WAV to local media store with 24h TTL
          │
          ▼
 [ 5. Response Serialization ] (~0.05s)
   - SubmitAnswerResponse (camelCase via by_alias=True)
   - Total round-trip latency target: ~3.5s - 6.0s (Ultra-fast inference via Groq)
```

---

## LLM Configuration: Groq `openai/gpt-oss-20b`

The backend natively supports Groq's high-speed inference engine using the open-weight model **`openai/gpt-oss-20b`**.

### Getting a Groq API Key
1. Go to [Groq Console](https://console.groq.com/keys).
2. Sign in and click **Create API Key**.
3. Copy the key (`gsk_...`).

In your `.env`:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
GROQ_MODEL_REPORT=openai/gpt-oss-20b
```

---

## Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `APP_ENV` | `dev` | Application runtime environment (`dev`, `production`) |
| `PUBLIC_BASE_URL` | `http://localhost:8000` | Base URL used to prefix generated audio URLs |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed frontend origins |
| `AUTH_DISABLED` | `false` | When `true`, uses a default test user ID without JWT checks |
| `CLERK_JWKS_URL` | `""` | Clerk JWKS public keys endpoint for RS256 token verification |
| `CLERK_ISSUER` | `""` | Expected Clerk token issuer (`iss` claim) |
| `STORAGE_BACKEND` | `memory` | Session storage engine (`memory` or `mongo`) |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |
| `MONGODB_DB` | `interviewiq` | MongoDB database name |
| `DEFAULT_TIMEZONE` | `Asia/Kolkata` | Timezone used for practice streak and weekly goal boundaries |
| `GNANI_API_KEY` | `""` | Gnani Vachana / Timbre unified API key |
| `LLM_PROVIDER` | `groq` | LLM client implementation (`groq`, `anthropic`, or `openai_compat`) |
| `GROQ_API_KEY` | `""` | Groq Cloud API Key |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible base URL |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Model used for real-time interview turn decisions |
| `GROQ_MODEL_REPORT` | `openai/gpt-oss-20b` | Model used for comprehensive report synthesis |
| `MEDIA_DIR` | `./storage/audio` | Directory storing synthesized audio WAV files |
| `MEDIA_TTL_HOURS` | `24` | Time-to-live for stored audio files |
| `MAX_UPLOAD_MB` | `10` | Maximum candidate audio upload size |
| `CODING_RATE_LIMIT_PER_HOUR` | `20` | Per-user limit for coding approach and code review requests |

## Coding + Voice Rounds

Create a session with `"type": "coding"` and optionally select `"codingLanguage"` as
`"python"`, `"javascript"`, or `"java"` (defaults to Python). The creation response
includes `codingProblem` with starter code for all three languages; the problem is
also available from `GET /api/sessions/{id}/coding/problem`.

Use the voice answer endpoint or `POST /api/sessions/{id}/coding/approach` with
`questionId` and an audio upload to discuss the algorithm. Spoken answers use the
same audio conversion and Gnani STT pipeline as regular interviews and can receive
up to two adaptive follow-up questions. Submit source as JSON to
`POST /api/sessions/{id}/coding/submit`, for example:

```json
{"language": "python", "code": "def solve(items):\n    return items"}
```

Candidate code is treated as untrusted text and reviewed statically by the LLM;
the backend never runs, compiles, or evaluates submitted code. The resulting review
and rubric scores are included in the session report. Coding routes have a per-user
hourly rate limit configured by `CODING_RATE_LIMIT_PER_HOUR`.

## Badge and Weekly Goal API

All endpoints below use the same Clerk Bearer token as the other `/api` endpoints.
JSON response keys use camelCase.

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/badges` | Returns all badge definitions, progress, and earned timestamps |
| `GET` | `/api/goals/weekly` | Reads the current weekly goal (default target: 3 interviews) |
| `PUT` | `/api/goals/weekly` | Updates `targetInterviews` (integer from 1 to 14) |
| `POST` | `/api/sessions/{id}/end` | Ends an interview and returns any newly earned `newBadges` |

An eligible completed interview has at least three answered questions. Weekly goal weeks
run Monday through Sunday in `DEFAULT_TIMEZONE`; its default is `Asia/Kolkata`.

---

## How to Run on Your Local Computer

### Prerequisites
1. **Python 3.11+** installed (`python3 --version`).
2. **FFmpeg** installed and on your PATH:
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt update && sudo apt install ffmpeg`
   - **Windows**: `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org).

### Step-by-Step Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv venv
# On Linux / macOS:
source venv/bin/activate
# On Windows PowerShell:
# .\venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create your local .env file
cp .env.example .env

# 5. Edit .env with your keys:
# Set AUTH_DISABLED=true (for local development without Clerk)
# Set LLM_PROVIDER=groq
# Set GROQ_API_KEY=gsk_your_key_here
# Set GROQ_MODEL=openai/gpt-oss-20b
# Set GNANI_API_KEY=your_gnani_key (optional, fallback browser speech is available)

# 6. Run the test suite
pytest

# 7. Start the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API docs will be available at:
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

---

### Running CLI Simulator & Tests

- **Run terminal 3-turn interview simulation using Groq `openai/gpt-oss-20b`**:
  ```bash
  python scripts/try_engine.py
  ```
- **Smoke test Gnani connectivity**:
  ```bash
  python scripts/smoke_gnani.py
  ```
- **Automated voice loop end-to-end test**:
  ```bash
  python scripts/e2e.py
  ```
- **Test with cURL**:
  ```bash
  bash scripts/dev_curl.sh
  ```

---

## Troubleshooting Guide

1. **Groq Model `openai/gpt-oss-20b`**:
   - The Groq client automatically requests JSON mode and strips any markdown code blocks before validation.
   - If you encounter rate limits on Groq free tier, the client retries with exponential backoff.
2. **429 Rate Limit from Gnani**:
   - Gnani accounts have a concurrency limit of 1 active request. The backend protects all calls with an internal `asyncio.Semaphore(1)` and exponential backoff retry.
3. **Audio Conversion / WebM Errors**:
   - Ensure `ffmpeg` is installed (`which ffmpeg` on macOS/Linux or `where ffmpeg` on Windows).
4. **CORS Errors from Frontend**:
   - Verify `CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"` in your `.env`.
5. **Empty Transcript (422 NO_SPEECH)**:
   - When candidate audio contains only background noise, the engine rejects with `NO_SPEECH` without consuming the question turn.
