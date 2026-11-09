"""Session lifecycle endpoints: creation, adaptive answering, completion, reports, and history."""

import time
import uuid
import asyncio
import logging
import datetime
from collections import defaultdict
from fastapi import APIRouter, Depends, UploadFile, File, Form

from app.config import get_settings
from app.errors import AppError
from app.auth.clerk import get_current_user
from app.db.base import Repository
from app.deps import get_repo
from app.schemas import (
    InterviewConfig,
    ResumeProfileData,
    StartSessionResponse,
    SubmitAnswerResponse,
    InterviewReport,
    SessionSummary,
    StoredSession,
    StoredTurn,
    Question,
    EndSessionResponse,
    Badge,
    CodingProblem,
    CodingSessionState,
    CodingApproachResponse,
    CodingSubmissionRequest,
    CodingSubmissionResponse,
    CodingResult,
    Language,
    Blueprint,
    BlueprintTopic,
)
from app.services.interview.engine import InterviewEngine
from app.services.interview.scoring import delivery_metrics
from app.services.audio import get_audio_duration_sec, prepare_audio_for_stt
from app.services.gnani_stt import GnaniSTT
from app.services.gnani_tts import GnaniTTS
from app.services.media_store import MediaStore
from app.services.reports import generate_report
from app.services.badges import award_badges

logger = logging.getLogger("interviewiq.sessions")
router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

# Concurrency & rate-limiting guards
_session_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
_session_rate_history: dict[str, list[float]] = defaultdict(list)
_answer_rate_history: dict[str, list[float]] = defaultdict(list)
_coding_rate_history: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(user_id: str, history: dict[str, list[float]], limit: int, window_sec: float, msg: str):
    """Enforces lightweight in-memory sliding window rate limits."""
    now = time.time()
    user_calls = [t for t in history[user_id] if now - t < window_sec]
    if len(user_calls) >= limit:
        raise AppError(status_code=429, code="RATE_LIMITED", message=msg)
    user_calls.append(now)
    history[user_id] = user_calls


async def _transcribe_audio(
    audio: UploadFile,
    language: Language,
    keyterms: list[str] | None,
    max_upload_mb: int,
    request_id: str,
) -> tuple[str, float]:
    """Runs the shared upload, audio conversion, and STT path for voice endpoints."""
    raw_audio = await audio.read()
    if not raw_audio:
        raise AppError(status_code=422, code="INVALID_AUDIO", message="Empty audio file submitted.")
    if len(raw_audio) > max_upload_mb * 1024 * 1024:
        raise AppError(
            status_code=413,
            code="FILE_TOO_LARGE",
            message=f"Audio file exceeds maximum size limit of {max_upload_mb}MB.",
        )
    duration = await get_audio_duration_sec(raw_audio)
    chunks = await prepare_audio_for_stt(raw_audio)
    transcript = await GnaniSTT().transcribe_chunks(
        chunks=chunks,
        language=language,
        keyterms=keyterms,
        request_id=request_id,
    )
    clean_transcript = transcript.strip()
    if not clean_transcript:
        raise AppError(
            status_code=422,
            code="NO_SPEECH",
            message="We couldn't hear you. Please try again and speak a little louder.",
        )
    return clean_transcript, duration


# -----------------------------------------------------------------------------
# POST /api/sessions
# -----------------------------------------------------------------------------
@router.post("", response_model=StartSessionResponse, response_model_by_alias=True)
async def create_session(
    config: InterviewConfig,
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> StartSessionResponse:
    """Initializes a new mock interview session and returns the opening question."""
    # Check rate limit: 10 per hour
    _check_rate_limit(
        user_id,
        _session_rate_history,
        limit=10,
        window_sec=3600.0,
        msg="Session creation rate limit exceeded. Please wait before starting another interview.",
    )

    # Validate duration
    if config.duration_min not in (5, 10, 15):
        raise AppError(status_code=422, code="INVALID_DURATION", message="Duration must be 5, 10, or 15 minutes.")

    t0 = time.time()
    engine = InterviewEngine()
    tts = GnaniTTS()
    media_store = MediaStore()
    stored_resume = await repo.get_resume_profile(user_id)
    resume_profile = (
        ResumeProfileData(**stored_resume.model_dump(exclude={"user_id", "updated_at"}))
        if stored_resume
        else None
    )

    coding_problem: CodingProblem | None = None
    coding_state: CodingSessionState | None = None
    if config.type == "coding":
        coding_problem = await engine.build_coding_problem(config)
        first_topic = BlueprintTopic(
            topic=coding_problem.title,
            opening_question=f"Please explain your approach to solve {coding_problem.title}.",
            expected_concepts=["algorithm", "data structures", "edge cases", "time complexity"],
            follow_up_hints=["correctness", "complexity", "edge cases"],
        )
        blueprint = Blueprint(topics=[first_topic])
    else:
        blueprint = await engine.build_blueprint(config, resume_profile)
        first_topic = blueprint.topics[0]

    # Synthesize opening question audio
    question_id = uuid.uuid4().hex[:12]
    audio_bytes = await tts.synthesize_safe(first_topic.opening_question, config.language)
    audio_url = await media_store.save_audio(audio_bytes) if audio_bytes else None

    first_question = Question(
        id=question_id,
        text=first_topic.opening_question,
        audio_url=audio_url,
        topic=first_topic.topic,
        is_follow_up=False,
        index=0,
    )
    if coding_problem:
        coding_state = CodingSessionState(
            problem=coding_problem,
            language=config.coding_language,
            question_id=question_id,
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    session_id = uuid.uuid4().hex[:16]

    stored_session = StoredSession(
        id=session_id,
        user_id=user_id,
        config=config,
        status="in_progress",
        started_at=now_iso,
        blueprint=blueprint,
        current_question=first_question,
        current_expected_concepts=first_topic.expected_concepts,
        topic_index=0,
        questions_asked=1,
        follow_ups_on_topic=0,
        turns=[],
        coding_state=coding_state,
    )

    await repo.save_session(stored_session)
    logger.info("Session %s created in %.2fs", session_id, time.time() - t0)

    return StartSessionResponse(
        session_id=session_id,
        first_question=first_question,
        config=config,
        started_at=now_iso,
        problem=coding_problem,
    )


@router.get(
    "/{session_id}/coding/problem",
    response_model=CodingProblem,
    response_model_by_alias=True,
)
async def get_coding_problem(
    session_id: str,
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> CodingProblem:
    """Returns the generated or curated coding problem persisted with the session."""
    session = await repo.get_session(session_id, user_id)
    if not session or not session.coding_state:
        raise AppError(404, "CODING_PROBLEM_NOT_FOUND", "Coding problem not found.")
    return session.coding_state.problem


async def _submit_coding_approach(
    session: StoredSession,
    session_id: str,
    question_id: str,
    audio: UploadFile,
    user_id: str,
    repo: Repository,
    *,
    allow_initial_replay: bool = False,
) -> SubmitAnswerResponse:
    """Evaluates spoken reasoning using the same conversion and STT path as /answer."""
    settings = get_settings()
    _check_rate_limit(
        user_id,
        _coding_rate_history,
        limit=max(1, settings.CODING_RATE_LIMIT_PER_HOUR),
        window_sec=3600.0,
        msg="Coding practice rate limit exceeded. Please wait before trying again.",
    )
    if session.coding_state is None:
        raise AppError(409, "NOT_CODING_SESSION", "This session is not a coding round.")
    if (
        allow_initial_replay
        and session.coding_state.approach_transcript
        and session.last_answer_response is not None
    ):
        return session.last_answer_response
    if (
        session.turns
        and session.turns[-1].question.id == question_id
        and session.last_answer_response is not None
    ):
        return session.last_answer_response
    active_question = session.current_question
    if (
        session.last_answer_response
        and session.last_answer_response.next_question
        and session.last_answer_response.next_question.id == question_id
        and active_question.id != question_id
    ):
        active_question = session.last_answer_response.next_question
        session.current_question = active_question
    if question_id != active_question.id:
        raise AppError(409, "QUESTION_MISMATCH", "Answer does not match current question.")

    state = session.coding_state
    transcript, audio_duration = await _transcribe_audio(
        audio=audio,
        language=session.config.language,
        keyterms=[state.problem.title],
        max_upload_mb=settings.MAX_UPLOAD_MB,
        request_id=f"coding_{session_id}_{question_id}",
    )
    evaluation, follow_up = await InterviewEngine().evaluate_coding_approach(session, transcript)
    if state.follow_up_count == 0 and not follow_up:
        follow_up = {
            "en": "What is the time and space complexity of your approach, and why?",
            "ta": "உங்கள் அணுகுமுறையின் நேர மற்றும் இட சிக்கல்தன்மை என்ன, ஏன்?",
            "hi": "आपके तरीके की समय और स्थान जटिलता क्या है, और क्यों?",
        }.get(session.config.language, "What is the time and space complexity of your approach, and why?")
    elif state.follow_up_count > 0:
        follow_up = None
    current_question = session.current_question
    wpm, filler_count = delivery_metrics(transcript, audio_duration)
    session.turns.append(
        StoredTurn(
            question=current_question,
            transcript=transcript,
            evaluation=evaluation,
            audio_duration_sec=audio_duration,
            wpm=wpm,
            filler_count=filler_count,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )
    )
    state.approach_transcript = (
        f"{state.approach_transcript}\n{transcript}".strip()
    )
    next_question = None
    is_complete = True
    if follow_up:
        next_question = Question(
            id=uuid.uuid4().hex[:12],
            text=follow_up[:300],
            topic=state.problem.title,
            is_follow_up=True,
            index=len(session.turns),
        )
        state.follow_up_count += 1
        state.question_id = next_question.id
        session.current_question = next_question
        session.current_expected_concepts = ["algorithm", "correctness", "complexity"]
        session.follow_ups_on_topic = state.follow_up_count
        is_complete = False

    response = SubmitAnswerResponse(
        transcript=transcript,
        evaluation=evaluation,
        next_question=next_question,
        is_complete=is_complete,
    )
    session.last_answer_response = response
    await repo.save_session(session)
    return response


# -----------------------------------------------------------------------------
# POST /api/sessions/{id}/answer
# -----------------------------------------------------------------------------
@router.post("/{session_id}/answer", response_model=SubmitAnswerResponse, response_model_by_alias=True)
async def submit_answer(
    session_id: str,
    question_id: str = Form(alias="questionId"),
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> SubmitAnswerResponse:
    """Processes candidate spoken answer, evaluates against rubrics, and plans next turn."""
    # Rate limit: 40 per 10 minutes
    _check_rate_limit(
        user_id,
        _answer_rate_history,
        limit=40,
        window_sec=600.0,
        msg="Answer rate limit exceeded. Please pace your responses.",
    )

    settings = get_settings()
    lock = _session_locks[session_id]

    async with lock:
        session = await repo.get_session(session_id, user_id)
        if not session or session.user_id != user_id:
            raise AppError(status_code=404, code="SESSION_NOT_FOUND", message="Interview session not found.")

        if session.status != "in_progress":
            raise AppError(status_code=409, code="SESSION_NOT_ACTIVE", message="Interview is no longer active.")

        if session.coding_state is not None:
            return await _submit_coding_approach(
                session, session_id, question_id, audio, user_id, repo
            )

        # Idempotency check: if frontend is retrying last turn
        if session.turns and session.turns[-1].question.id == question_id and session.last_answer_response:
            logger.info("Serving idempotent cached answer response for question %s", question_id)
            return session.last_answer_response

        # Check question mismatch
        if question_id != session.current_question.id:
            raise AppError(status_code=409, code="QUESTION_MISMATCH", message="Answer does not match current question.")

        t_start = time.time()
        # Step 1-2: shared audio conversion and Speech-to-Text pipeline
        keyterms = session.current_expected_concepts if settings.STT_BIAS_ENABLED else None
        t_stt0 = time.time()
        clean_transcript, audio_dur_sec = await _transcribe_audio(
            audio,
            language=session.config.language,
            keyterms=keyterms,
            max_upload_mb=settings.MAX_UPLOAD_MB,
            request_id=f"answer_{session_id}_{question_id}",
        )
        t_stt = time.time() - t_stt0

        # Step 3: LLM Evaluation and Planning
        t_llm0 = time.time()
        engine = InterviewEngine()
        evaluation, next_question, is_complete = await engine.evaluate_and_plan(
            session=session,
            transcript=clean_transcript,
            audio_duration_sec=audio_dur_sec,
        )
        t_llm = time.time() - t_llm0

        # Step 4: Text-to-Speech synthesis for next question
        t_tts0 = time.time()
        tts_client = GnaniTTS()
        media_store = MediaStore()

        if next_question and not is_complete:
            next_audio_bytes = await tts_client.synthesize_safe(next_question.text, session.config.language)
            if next_audio_bytes:
                next_question.audio_url = await media_store.save_audio(next_audio_bytes)
        t_tts = time.time() - t_tts0

        # Step 5: Persist Turn and update Session state
        wpm, filler_count = delivery_metrics(clean_transcript, audio_dur_sec)
        stored_turn = StoredTurn(
            question=session.current_question,
            transcript=clean_transcript,
            evaluation=evaluation,
            audio_duration_sec=audio_dur_sec,
            wpm=wpm,
            filler_count=filler_count,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )
        session.turns.append(stored_turn)

        if next_question and not is_complete:
            session.current_question = next_question
            session.questions_asked += 1
            if next_question.is_follow_up:
                session.follow_ups_on_topic += 1
            else:
                session.follow_ups_on_topic = 0

        answer_response = SubmitAnswerResponse(
            transcript=clean_transcript,
            evaluation=evaluation,
            next_question=next_question if not is_complete else None,
            is_complete=is_complete,
        )
        session.last_answer_response = answer_response
        await repo.save_session(session)

        t_total = time.time() - t_start
        logger.info(
            "Session %s turn completed in %.2fs [convert+stt=%.2fs, llm=%.2fs, tts=%.2fs]",
            session_id,
            t_total,
            t_stt,
            t_llm,
            t_tts,
        )

        return answer_response


@router.post(
    "/{session_id}/coding/approach",
    response_model=CodingApproachResponse,
    response_model_by_alias=True,
)
async def submit_coding_approach(
    session_id: str,
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> CodingApproachResponse:
    """Transcribes and evaluates a spoken explanation for a coding problem."""
    async with _session_locks[session_id]:
        session = await repo.get_session(session_id, user_id)
        if not session or session.user_id != user_id:
            raise AppError(404, "SESSION_NOT_FOUND", "Interview session not found.")
        if session.status != "in_progress":
            raise AppError(409, "SESSION_NOT_ACTIVE", "Interview is no longer active.")
        response = await _submit_coding_approach(
            session,
            session_id,
            session.current_question.id,
            audio,
            user_id,
            repo,
            allow_initial_replay=True,
        )
        return CodingApproachResponse(**response.model_dump())


@router.post(
    "/{session_id}/coding/submit",
    response_model=CodingSubmissionResponse,
    response_model_by_alias=True,
)
async def submit_coding_solution(
    session_id: str,
    payload: CodingSubmissionRequest,
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> CodingSubmissionResponse:
    """Reviews candidate source statically; the submitted code is never executed."""
    settings = get_settings()
    async with _session_locks[session_id]:
        session = await repo.get_session(session_id, user_id)
        if not session or session.user_id != user_id:
            raise AppError(404, "SESSION_NOT_FOUND", "Interview session not found.")
        if session.status != "in_progress":
            raise AppError(409, "SESSION_NOT_ACTIVE", "Interview is no longer active.")
        state = session.coding_state
        if state is None:
            raise AppError(409, "NOT_CODING_SESSION", "This session is not a coding round.")
        if state.review and state.submitted_code is not None:
            return CodingSubmissionResponse(
                result=CodingResult(
                    problem=state.problem,
                    language=state.language,
                    submitted_code=state.submitted_code,
                    approach_transcript=state.approach_transcript,
                    review=state.review,
                )
            )
        _check_rate_limit(
            user_id,
            _coding_rate_history,
            limit=max(1, settings.CODING_RATE_LIMIT_PER_HOUR),
            window_sec=3600.0,
            msg="Coding practice rate limit exceeded. Please wait before trying again.",
        )
        if not state.approach_transcript.strip():
            raise AppError(
                409,
                "CODING_APPROACH_REQUIRED",
                "Explain your approach aloud before submitting code.",
            )
        language = payload.language or state.language
        if language != state.language:
            raise AppError(
                422,
                "CODING_LANGUAGE_MISMATCH",
                "Submission language must match the coding session language.",
            )
        code = payload.code.strip()
        if not code:
            raise AppError(422, "EMPTY_CODE", "Code submission cannot be empty.")

        review = await InterviewEngine().review_coding_submission(session, code, language)
        state.submitted_code = code
        state.review = review
        await repo.save_session(session)
        return CodingSubmissionResponse(
            result=CodingResult(
                problem=state.problem,
                language=language,
                submitted_code=code,
                approach_transcript=state.approach_transcript,
                review=review,
            )
        )


# -----------------------------------------------------------------------------
# POST /api/sessions/{id}/end
# -----------------------------------------------------------------------------
@router.post(
    "/{session_id}/end",
    response_model=EndSessionResponse,
    response_model_by_alias=True,
)
async def end_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> EndSessionResponse:
    """Concludes an interview session and triggers asynchronous or inline report generation."""
    lock = _session_locks[session_id]

    async with lock:
        session = await repo.get_session(session_id, user_id)
        if not session or session.user_id != user_id:
            raise AppError(status_code=404, code="SESSION_NOT_FOUND", message="Interview session not found.")

        # Idempotent return if already completed
        if session.status == "completed":
            new_badges = await _award_session_badges(user_id, session, repo)
            return EndSessionResponse(session_id=session_id, new_badges=new_badges)

        # If abandoned with no turns
        if not session.turns:
            session.status = "abandoned"
            session.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            await repo.save_session(session)
            return EndSessionResponse(session_id=session_id)

        # Mark completed and generate report
        session.status = "completed"
        session.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        report = await generate_report(session)
        session.report = report
        await repo.save_session(session)

        new_badges = await _award_session_badges(user_id, session, repo)
        return EndSessionResponse(session_id=session_id, new_badges=new_badges)


async def _award_session_badges(
    user_id: str,
    session: StoredSession,
    repo: Repository,
) -> list[Badge]:
    try:
        return await award_badges(user_id, session, repo)
    except Exception:
        logger.exception("Could not award badges for completed session %s", session.id)
        return []


# -----------------------------------------------------------------------------
# GET /api/sessions/{id}/report
# -----------------------------------------------------------------------------
@router.get("/{session_id}/report", response_model=InterviewReport, response_model_by_alias=True)
async def get_session_report(
    session_id: str,
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> InterviewReport:
    """Fetches the comprehensive performance report for a completed session."""
    session = await repo.get_session(session_id, user_id)
    if not session or session.user_id != user_id:
        raise AppError(status_code=404, code="SESSION_NOT_FOUND", message="Interview session not found.")

    if session.report is not None:
        cached_report = session.report
        report = await generate_report(session)
        if session.report is not cached_report:
            await repo.save_session(session)
        return report

    # If abandoned or in_progress without turns
    if not session.turns or session.status == "abandoned":
        raise AppError(
            status_code=404,
            code="REPORT_NOT_AVAILABLE",
            message="No performance report is available for this session.",
        )

    # Lazy generation if session has turns but report is missing
    lock = _session_locks[session_id]
    async with lock:
        session.status = "completed"
        if not session.completed_at:
            session.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        report = await generate_report(session)
        session.report = report
        await repo.save_session(session)
        return report


# -----------------------------------------------------------------------------
# GET /api/sessions
# -----------------------------------------------------------------------------
@router.get("", response_model=list[SessionSummary], response_model_by_alias=True)
async def list_sessions(
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> list[SessionSummary]:
    """Retrieves all past interview sessions for the current user, ordered newest first."""
    sessions = await repo.list_sessions(user_id)
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    summaries: list[SessionSummary] = []

    for s in sessions:
        started_dt = datetime.datetime.fromisoformat(s.started_at)
        elapsed_sec = max(0, int((now_dt - started_dt).total_seconds()))

        # Treat abandoned if in_progress and older than 2 hours
        effective_status = s.status
        if s.status == "in_progress" and elapsed_sec > 7200:
            effective_status = "abandoned"

        # Calculate overall score
        overall_score: int | None = None
        if s.report is not None:
            overall_score = s.report.overall_score
        elif s.turns:
            overall_score = round(sum(t.evaluation.overall for t in s.turns) / len(s.turns))

        # Calculate duration
        if s.completed_at:
            try:
                comp_dt = datetime.datetime.fromisoformat(s.completed_at)
                duration_sec = max(1, int((comp_dt - started_dt).total_seconds()))
            except ValueError:
                duration_sec = min(elapsed_sec, s.config.duration_min * 60)
        else:
            duration_sec = min(elapsed_sec, s.config.duration_min * 60)

        summaries.append(
            SessionSummary(
                session_id=s.id,
                config=s.config,
                started_at=s.started_at,
                status=effective_status,
                overall_score=overall_score,
                duration_sec=duration_sec,
            )
        )

    # Sort newest first
    summaries.sort(key=lambda x: x.started_at, reverse=True)
    return summaries
