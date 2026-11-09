"""Scoring calculations, rubric weighting, and delivery metric extraction."""

import re
from app.schemas import AnswerEvaluation, RubricScores, StoredSession, StoredTurn, TopicScore

RUBRIC_WEIGHTS = {
    "technical_correctness": 0.35,
    "conceptual_understanding": 0.25,
    "completeness": 0.20,
    "relevance": 0.10,
    "communication_clarity": 0.10,
}

FILLERS = [
    r"\bum\b", r"\buh\b", r"\blike\b", r"\byou know\b", r"\bbasically\b", r"\bactually\b",
    r"\bஅத\b", r"\bஆமா\b", r"\bमतलब\b", r"\bजैसे\b"
]


def clamp_scores(scores: RubricScores) -> RubricScores:
    """Normalizes legacy 1-5 model scores, then clamps rubric values to 0-100."""
    values = [
        scores.technical_correctness,
        scores.conceptual_understanding,
        scores.completeness,
        scores.relevance,
        scores.communication_clarity,
    ]
    scale = 20 if max(values, default=0) <= 5 else 1
    return RubricScores(
        technical_correctness=max(0, min(100, scores.technical_correctness * scale)),
        conceptual_understanding=max(0, min(100, scores.conceptual_understanding * scale)),
        completeness=max(0, min(100, scores.completeness * scale)),
        relevance=max(0, min(100, scores.relevance * scale)),
        communication_clarity=max(0, min(100, scores.communication_clarity * scale)),
    )


def normalize_legacy_evaluation(evaluation: AnswerEvaluation) -> bool:
    """Converts persisted 1-5 rubric evaluations to the API's 0-100 scale."""
    values = [
        evaluation.scores.technical_correctness,
        evaluation.scores.conceptual_understanding,
        evaluation.scores.completeness,
        evaluation.scores.relevance,
        evaluation.scores.communication_clarity,
    ]
    if max(values, default=0) > 5:
        return False
    evaluation.scores = clamp_scores(evaluation.scores)
    evaluation.overall = compute_overall(evaluation.scores)
    return True


def normalize_legacy_session_scores(session: StoredSession) -> bool:
    """Migrates old 1-5 evaluations in a session and invalidates its cached report."""
    changed = False
    for turn in session.turns:
        changed = normalize_legacy_evaluation(turn.evaluation) or changed
    if session.coding_state and session.coding_state.review:
        changed = normalize_legacy_evaluation(
            session.coding_state.review.evaluation
        ) or changed
    if changed:
        session.report = None
    return changed


def compute_overall(scores: RubricScores) -> int:
    """Computes the authoritative overall composite score using rubric weights."""
    c = clamp_scores(scores)
    weighted_sum = (
        c.technical_correctness * RUBRIC_WEIGHTS["technical_correctness"]
        + c.conceptual_understanding * RUBRIC_WEIGHTS["conceptual_understanding"]
        + c.completeness * RUBRIC_WEIGHTS["completeness"]
        + c.relevance * RUBRIC_WEIGHTS["relevance"]
        + c.communication_clarity * RUBRIC_WEIGHTS["communication_clarity"]
    )
    return round(weighted_sum)


def delivery_metrics(transcript: str, duration_sec: float) -> tuple[int, int]:
    """Computes speaking pace in words-per-minute (WPM) and filler pause counts."""
    words = re.findall(r"\b\w+\b", transcript)
    word_count = len(words)

    # Calculate WPM
    dur_min = max(0.05, duration_sec / 60.0)
    wpm = round(word_count / dur_min)

    # Count fillers
    lower_text = transcript.lower()
    filler_count = 0
    for pattern in FILLERS:
        filler_count += len(re.findall(pattern, lower_text))

    return wpm, filler_count


def aggregate_scores(
    turns: list[StoredTurn],
    coding_evaluation: AnswerEvaluation | None = None,
) -> RubricScores:
    """Averages each rubric dimension across all turns."""
    evaluations = [turn.evaluation for turn in turns]
    if coding_evaluation is not None:
        evaluations.append(coding_evaluation)
    if not evaluations:
        return RubricScores(
            technical_correctness=0,
            conceptual_understanding=0,
            completeness=0,
            relevance=0,
            communication_clarity=0,
        )

    n = len(evaluations)
    tc = round(sum(item.scores.technical_correctness for item in evaluations) / n)
    cu = round(sum(item.scores.conceptual_understanding for item in evaluations) / n)
    co = round(sum(item.scores.completeness for item in evaluations) / n)
    re_score = round(sum(item.scores.relevance for item in evaluations) / n)
    cc = round(sum(item.scores.communication_clarity for item in evaluations) / n)

    return RubricScores(
        technical_correctness=tc,
        conceptual_understanding=cu,
        completeness=co,
        relevance=re_score,
        communication_clarity=cc,
    )


def overall_report_score(
    turns: list[StoredTurn],
    coding_evaluation: AnswerEvaluation | None = None,
) -> int:
    """Calculates overall interview score as the rounded average of turn overalls."""
    scores = [turn.evaluation.overall for turn in turns]
    if coding_evaluation is not None:
        scores.append(coding_evaluation.overall)
    if not scores:
        return 0
    return round(sum(scores) / len(scores))


def topic_scores(
    turns: list[StoredTurn],
    coding_evaluation: AnswerEvaluation | None = None,
    coding_topic: str | None = None,
) -> list[TopicScore]:
    """Groups turns by topic, computes averages, and sorts from lowest score to highest."""
    topic_map: dict[str, list[int]] = {}
    for t in turns:
        topic_name = t.question.topic or "General"
        topic_map.setdefault(topic_name, []).append(t.evaluation.overall)
    if coding_evaluation is not None:
        topic_map.setdefault(coding_topic or "Coding", []).append(coding_evaluation.overall)

    result = []
    for topic, scores in topic_map.items():
        avg = round(sum(scores) / len(scores))
        result.append(TopicScore(topic=topic, score=avg))

    # Sort weakest first
    result.sort(key=lambda x: x.score)
    return result
