# InterviewIQ AI

> **Adaptive voice mock interviews powered by Groq (`openai/gpt-oss-20b`), Gnani Prisma STT, and Timbre TTS.**

InterviewIQ AI conducts realistic, spoken mock interviews with multi-turn adaptive reasoning in English and Tamil. It listens to candidate responses, computes delivery metrics (speaking pace, filler words), scores technical correctness and conceptual depth across a 5-dimension rubric, and adapts follow-up questions in real time.

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 SPA on port 3000.
  - Live audio recorder with speech visualizer.
  - Browser SpeechSynthesis fallback for English and Tamil.
  - Interactive dashboard, setup wizard, performance report with rubric breakdown, and history.
- **Backend**: FastAPI (Python 3.11+) on port 8000.
  - **LLM Engine**: Groq with **`openai/gpt-oss-20b`** for ultra-fast, structured JSON multi-turn interview evaluation.
  - **Voice Pipeline**: Gnani Prisma STT (16 kHz mono WAV) + Timbre TTS (v2.5 *Kaveri* / *Vedika*).
  - Storage: In-memory repository (default) or MongoDB.
  - Optional resume onboarding extracts a concise career profile from PDF/DOCX uploads and uses it to personalize interview questions. The original resume is not retained; MongoDB profile storage requires `STORAGE_BACKEND=mongo`.
- **Full-Stack Node Server**: `server.ts` running Express on port 3000 mounting Vite in development.

---

## How to Run on Your Local Computer

You can run InterviewIQ AI in two ways:
1. **Full-Stack Mode** (Frontend + Express API on port 3000) — instant, zero-dependency launch.
2. **FastAPI + Groq + Vite Mode** (Python FastAPI on port 8000 + React Frontend on port 3000) — runs the full voice & LLM pipeline with Groq `openai/gpt-oss-20b`.

---

### Option A: Quick Start (Node.js Full-Stack)

Ideal for trying out the UI, recording audio, and viewing sample reports immediately.

```bash
# 1. Install Node dependencies
npm install

# 2. Start the application
npm run dev
```

Open your browser to:
**`http://localhost:3000`**

---

### Option B: Running with Python FastAPI & Groq (`openai/gpt-oss-20b`)

Follow these steps to run the complete Python backend powered by Groq:

#### 1. System Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.11+
- **FFmpeg** (required for audio conversion):
  - macOS: `brew install ffmpeg`
  - Linux (Ubuntu/Debian): `sudo apt update && sudo apt install ffmpeg`
  - Windows: `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org)

#### 2. Get a Free Groq API Key
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys).
2. Create an account and click **Create API Key**.
3. Copy your key (`gsk_...`).

#### 3. Start the FastAPI Backend

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows PowerShell:
# .\venv\Scripts\Activate.ps1

# 3. Install Python requirements
pip install -r requirements.txt

# 4. Create your .env configuration
cp .env.example .env
```

Edit `backend/.env` with your settings:
```env
# Disable Clerk auth for easy local development
AUTH_DISABLED=true

# Groq Cloud Configuration
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
GROQ_MODEL_REPORT=openai/gpt-oss-20b

# Gnani Voice STT & TTS (Optional: if not set, frontend uses browser voice)
GNANI_API_KEY=""
```

Now start the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health at:
- `http://localhost:8000/api/health`
- Interactive API Docs: `http://localhost:8000/docs`

#### 4. Start the Frontend (Connected to FastAPI)

In a separate terminal window at the project root:

```bash
# 1. Create a root .env.local file and set the Clerk publishable key
#    from your Clerk dashboard (do not commit this file).
#    Also enable Google as a social connection in the Clerk dashboard.
# 2. Set environment variables to point to local FastAPI
# On macOS/Linux:
export VITE_NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
export VITE_NEXT_PUBLIC_USE_MOCK="false"
# export VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key"

# 2. Run the dev server
npm run dev
```

Open **`http://localhost:3000`** in Google Chrome or Microsoft Edge (recommended for microphone permissions).

---

## Running CLI Simulation & Tests

In the `backend/` directory with your virtual environment active:

- **Terminal 3-Turn CLI Interview Simulation**:
  ```bash
  python scripts/try_engine.py
  ```
  Runs a simulated interview using Groq's `openai/gpt-oss-20b` directly in your terminal with live scoring!

- **Automated Backend Tests**:
  ```bash
  pytest
  ```

- **Dev cURL Pipeline**:
  ```bash
  bash scripts/dev_curl.sh
  ```

- **Full Voice Loop Test**:
  ```bash
  python scripts/e2e.py
  ```

---

## Key Features

- **Adaptive Questioning**: Automatically adjusts depth based on rolling score averages; probes missing concepts without asking redundant questions.
- **Strict Guardrails**: Hard limit of 2 follow-ups per topic, duration-based stopping criteria, and immunity to prompt injection in candidate answers.
- **Bilingual Voice Engine**: Conduct technical and behavioural interviews in Indian English or Tamil.
- **Comprehensive Rubric**: Technical correctness (35%), conceptual understanding (25%), completeness (20%), relevance (10%), communication clarity (10%).
- **Personalized Action Plan**: Generates actionable study plans and model answers for every question asked.
