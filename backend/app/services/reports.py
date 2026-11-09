"""Performance report generator creating comprehensive multi-dimensional evaluations."""

import logging
import datetime
from app.config import get_settings
from app.schemas import (
    StoredSession,
    InterviewReport,
    QuestionResult,
    StudyPlanItem,
    TopicScore,
    CodingResult,
)
from app.services.llm.base import LLMClient
from app.services.llm import get_llm
from app.services.gnani_tts import GnaniTTS
from app.services.media_store import MediaStore
from app.services.interview.prompts import (
    REPORT_SYSTEM,
    REPORT_USER,
    ReportNarrative,
)
from app.services.interview.scoring import (
    aggregate_scores,
    normalize_legacy_session_scores,
    overall_report_score,
    topic_scores,
)

logger = logging.getLogger("interviewiq.reports")


async def generate_report(
    session: StoredSession,
    llm: LLMClient | None = None,
    tts: GnaniTTS | None = None,
    media: MediaStore | None = None,
) -> InterviewReport:
    """Generates the comprehensive final report for an interview session.
    
    Idempotent: if session.report is already generated, returns it immediately.
    """
    normalize_legacy_session_scores(session)
    if session.report is not None:
        return session.report

    settings = get_settings()
    llm_client = llm or get_llm()
    tts_client = tts or GnaniTTS()
    media_store = media or MediaStore()

    # Calculate timestamps and duration
    started_dt = datetime.datetime.fromisoformat(session.started_at)
    completed_dt = (
        datetime.datetime.fromisoformat(session.completed_at)
        if session.completed_at
        else datetime.datetime.now(datetime.timezone.utc)
    )
    duration_sec = max(1, int((completed_dt - started_dt).total_seconds()))

    # Basic aggregate scores
    coding_state = session.coding_state
    coding_evaluation = coding_state.review.evaluation if coding_state and coding_state.review else None
    coding_topic = coding_state.problem.title if coding_state else None
    avg_scores = aggregate_scores(session.turns, coding_evaluation)
    final_overall = overall_report_score(session.turns, coding_evaluation)
    t_scores = topic_scores(session.turns, coding_evaluation, coding_topic)

    # Initial QuestionResults
    question_results = [
        QuestionResult(
            question=t.question,
            transcript=t.transcript,
            evaluation=t.evaluation,
        )
        for t in session.turns
    ]

    # Format detail summaries for LLM prompt
    turns_detail = "\n\n".join(
        f"Question {i+1} [ID: {t.question.id}] ({t.question.topic}):\n"
        f"Prompt: {t.question.text}\n"
        f"Transcript: {t.transcript}\n"
        f"Score: {t.evaluation.overall}/100 (Tech: {t.evaluation.scores.technical_correctness}, Concept: {t.evaluation.scores.conceptual_understanding})\n"
        f"Missing Concepts: {', '.join(t.evaluation.missing_concepts) if t.evaluation.missing_concepts else 'None'}"
        for i, t in enumerate(session.turns)
    ) or "No turns recorded."

    if coding_state and coding_state.review:
        review = coding_state.review
        turns_detail += (
            f"\n\nCoding submission [{coding_state.language}] for {coding_state.problem.title}:\n"
            f"Score: {review.evaluation.overall}/100\n"
            f"Correctness: {review.correctness_summary}\n"
            f"Complexity: time {review.time_complexity}, space {review.space_complexity}\n"
            f"Static review: {review.review}"
        )
    topic_summary_str = "\n".join(f"- {ts.topic}: {ts.score}/100" for ts in t_scores) or "None"

    lang_names = {"en": "English", "ta": "Tamil", "hi": "Hindi"}
    language_name = lang_names.get(session.config.language, "English")

    system_prompt = REPORT_SYSTEM.format(language_name=language_name)
    user_prompt = REPORT_USER.format(
        interview_type=session.config.type,
        domain=session.config.domain,
        difficulty=session.config.difficulty,
        duration_sec=duration_sec,
        turns_detail=turns_detail,
        topic_scores_summary=topic_summary_str,
    )

    if settings.LLM_PROVIDER == "groq":
        model_name = settings.GROQ_MODEL_REPORT
    elif settings.LLM_PROVIDER == "openai_compat":
        model_name = settings.OPENAI_COMPAT_MODEL_REPORT
    else:
        model_name = settings.LLM_MODEL_REPORT

    try:
        narrative = await llm_client.generate_json(
            system=system_prompt,
            user=user_prompt,
            schema=ReportNarrative,
            model=model_name,
            max_tokens=2500,
            temperature=0.3,
        )

        strengths = narrative.strengths
        weaknesses = narrative.weaknesses
        summary_feedback = narrative.summary_feedback
        study_plan = narrative.study_plan

        # Map model answers to results
        answer_map = {ma.question_id: ma.model_answer for ma in narrative.model_answers}
        for idx, qr in enumerate(question_results):
            if qr.question.id in answer_map:
                qr.evaluation.model_answer = answer_map[qr.question.id]
            elif idx < len(narrative.model_answers):
                qr.evaluation.model_answer = narrative.model_answers[idx].model_answer

    except Exception as err:
        logger.error("LLM report generation failed, falling back to rule-based summary: %s", err)
        # Graceful fallback: synthesize rule-based evaluation
        weakest_topic = t_scores[0].topic if t_scores else session.config.domain
        strengths = [
            f"Demonstrated engagement across {len(session.turns)} question rounds",
            f"Solid baseline knowledge in {session.config.domain}",
        ]
        weaknesses = [
            f"Deepen technical precision around {weakest_topic}",
            "Provide more structured trade-off explanations with concrete examples",
        ]
        summary_feedback = (
            f"You completed your mock interview for {session.config.domain} with an overall score of {final_overall}/100. "
            f"Your performance was steady throughout. Prioritize reviewing {weakest_topic} to maximize your readiness."
        )
        study_plan = [
            StudyPlanItem(
                topic=weakest_topic,
                reason="Area identified for improvement during mock interview turns.",
                suggested_questions=[
                    f"Explain core internal mechanics of {weakest_topic}.",
                    f"Compare trade-offs and edge cases in {weakest_topic}.",
                ],
            )
        ]

    # Synthesize audio summary using Gnani Timbre
    summary_audio_url: str | None = None
    try:
        audio_bytes = await tts_client.synthesize_safe(summary_feedback, session.config.language)
        if audio_bytes:
            summary_audio_url = await media_store.save_audio(audio_bytes)
    except Exception as err:
        logger.warning("Failed to generate summary audio: %s", err)

    report = InterviewReport(
        session_id=session.id,
        config=session.config,
        started_at=session.started_at,
        completed_at=completed_dt.isoformat(),
        duration_sec=duration_sec,
        overall_score=final_overall,
        scores=avg_scores,
        topic_scores=t_scores,
        strengths=strengths,
        weaknesses=weaknesses,
        results=question_results,
        study_plan=study_plan,
        summary_feedback=summary_feedback,
        summary_audio_url=summary_audio_url,
        coding_result=(
            CodingResult(
                problem=coding_state.problem,
                language=coding_state.language,
                submitted_code=coding_state.submitted_code,
                approach_transcript=coding_state.approach_transcript,
                review=coding_state.review,
            )
            if coding_state and coding_state.review and coding_state.submitted_code is not None
            else None
        ),
    )

    session.report = report
    return report
