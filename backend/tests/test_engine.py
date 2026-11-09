"""Tests for InterviewEngine, rubric scoring math, and server-side decision enforcement."""

import pytest
import datetime
from app.schemas import (
    InterviewConfig,
    StoredSession,
    Question,
    Blueprint,
    BlueprintTopic,
    RubricScores,
    StoredTurn,
    AnswerEvaluation,
)
from app.services.interview.scoring import (
    compute_overall,
    clamp_scores,
    delivery_metrics,
    topic_scores,
)
from app.services.interview.engine import InterviewEngine
from app.services.interview.prompts import (
    TurnDecision,
    TurnDecisionAction,
    TurnEvaluation,
    NextQuestionOutput,
)


class FakeLLM:
    """Mock LLM returning deterministic structured models for testing."""

    def __init__(self, decision_response: TurnDecision | None = None):
        self.decision_response = decision_response
        self.calls = []

    async def generate_json(self, *, system: str, user: str, schema, model: str, **kwargs):
        self.calls.append({"system": system, "user": user, "schema": schema})
        if self.decision_response:
            return self.decision_response
        return schema()


def test_rubric_weights_calculation():
    scores = RubricScores(
        technical_correctness=85,
        conceptual_understanding=75,
        completeness=70,
        relevance=90,
        communication_clarity=65,
    )
    overall = compute_overall(scores)
    # 85*0.35 (29.75) + 75*0.25 (18.75) + 70*0.20 (14.0) + 90*0.10 (9.0) + 65*0.10 (6.5) = 78.0
    assert overall == 78


def test_score_clamping():
    scores = RubricScores(
        technical_correctness=150,
        conceptual_understanding=-20,
        completeness=100,
        relevance=0,
        communication_clarity=50,
    )
    clamped = clamp_scores(scores)
    assert clamped.technical_correctness == 100
    assert clamped.conceptual_understanding == 0


def test_legacy_five_point_scores_are_normalized_to_percent():
    scores = RubricScores(
        technical_correctness=4,
        conceptual_understanding=4,
        completeness=3,
        relevance=5,
        communication_clarity=3,
    )

    normalized = clamp_scores(scores)

    assert normalized == RubricScores(
        technical_correctness=80,
        conceptual_understanding=80,
        completeness=60,
        relevance=100,
        communication_clarity=60,
    )
    assert compute_overall(normalized) == 76


def test_delivery_metrics():
    transcript = "Um basically we use like a mutex lock to actually prevent race conditions."
    wpm, fillers = delivery_metrics(transcript, duration_sec=10.0)
    assert fillers >= 3
    assert wpm > 0


@pytest.mark.asyncio
async def test_empty_answer_handling():
    engine = InterviewEngine(llm=FakeLLM())
    config = InterviewConfig(type="technical", domain="Databases", difficulty="intermediate", duration_min=5, language="en")
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    session = StoredSession(
        id="s1",
        user_id="u1",
        config=config,
        status="in_progress",
        started_at=now_iso,
        blueprint=Blueprint(topics=[
            BlueprintTopic(topic="Indexes", opening_question="What is a B-tree?", expected_concepts=["balanced tree", "log N"], follow_up_hints=[])
        ]),
        current_question=Question(id="q1", text="What is a B-tree?", topic="Indexes", is_follow_up=False, index=0),
        current_expected_concepts=["balanced tree"],
        topic_index=0,
        questions_asked=1,
        follow_ups_on_topic=0,
    )

    evaluation, next_q, is_complete = await engine.evaluate_and_plan(session, transcript="um no", audio_duration_sec=3.0)
    assert evaluation.overall <= 25
    assert next_q is not None
    assert "Let's try that again" in next_q.text or "மீண்டும்" in next_q.text
    assert is_complete is False


@pytest.mark.asyncio
async def test_follow_up_cap_enforcement():
    # LLM requests a 3rd follow_up, but engine must enforce max 2 and move to next_topic
    fake_decision = TurnDecision(
        evaluation=TurnEvaluation(
            scores=RubricScores(
                technical_correctness=80,
                conceptual_understanding=80,
                completeness=80,
                relevance=80,
                communication_clarity=80,
            ),
            strengths=["Good"],
            improvements=["None"],
            missing_concepts=[],
            concepts_covered=["all"],
        ),
        decision=TurnDecisionAction(action="follow_up", reason="Wants more follow up"),
        next_question=NextQuestionOutput(
            text="Can you explain more details?",
            topic="Indexes",
            expected_concepts=["details"],
        ),
    )

    engine = InterviewEngine(llm=FakeLLM(decision_response=fake_decision))
    config = InterviewConfig(type="technical", domain="Databases", difficulty="intermediate", duration_min=5, language="en")
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    session = StoredSession(
        id="s1",
        user_id="u1",
        config=config,
        status="in_progress",
        started_at=now_iso,
        blueprint=Blueprint(topics=[
            BlueprintTopic(topic="Indexes", opening_question="What is a B-tree?", expected_concepts=["b-tree"], follow_up_hints=[]),
            BlueprintTopic(topic="Transactions", opening_question="Explain ACID.", expected_concepts=["acid"], follow_up_hints=[]),
        ]),
        current_question=Question(id="q1", text="Follow-up question 2", topic="Indexes", is_follow_up=True, index=2),
        current_expected_concepts=["b-tree"],
        topic_index=0,
        questions_asked=3,
        follow_ups_on_topic=2,  # Already at max 2 follow-ups on this topic
    )

    eval_out, next_q, is_complete = await engine.evaluate_and_plan(
        session,
        transcript="A B-tree maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.",
        audio_duration_sec=15.0,
    )

    # Engine must have forced next_topic
    assert next_q is not None
    assert next_q.topic == "Transactions"
    assert next_q.is_follow_up is False
