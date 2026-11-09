import datetime

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db.memory import MemoryRepository
from app.deps import get_repo
from app.main import app
from app.schemas import (
    AnswerEvaluation,
    Blueprint,
    BlueprintTopic,
    InterviewConfig,
    InterviewReport,
    Question,
    QuestionResult,
    RubricScores,
    StoredSession,
    StoredTurn,
)
from app.services.badges import award_badges, evaluate_progress, list_badges
from app.services.goals import compute_weekly_goal
from app.services.stats import longest_streak

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_settings(monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("DEFAULT_TIMEZONE", "Asia/Kolkata")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def make_session(
    index: int,
    completed_at: datetime.datetime,
    *,
    turn_count: int = 3,
    score: int = 75,
    interview_type: str = "technical",
    language: str = "en",
    domain: str = "Python",
) -> StoredSession:
    config = InterviewConfig(
        type=interview_type,
        domain=domain,
        difficulty="intermediate",
        duration_min=5,
        language=language,
    )
    question = Question(
        id=f"q-{index}",
        text="Explain the topic.",
        topic=domain,
        index=0,
    )
    evaluation = AnswerEvaluation(
        overall=score,
        scores=RubricScores(
            technical_correctness=score,
            conceptual_understanding=score,
            completeness=score,
            relevance=score,
            communication_clarity=score,
        ),
        strengths=[],
        improvements=[],
        missing_concepts=[],
    )
    turns = [
        StoredTurn(
            question=question,
            transcript="Answer.",
            evaluation=evaluation,
            created_at=completed_at.isoformat(),
        )
        for _ in range(turn_count)
    ]
    report = InterviewReport(
        session_id=f"s-{index}",
        config=config,
        started_at=(completed_at - datetime.timedelta(minutes=5)).isoformat(),
        completed_at=completed_at.isoformat(),
        duration_sec=300,
        overall_score=score,
        scores=evaluation.scores,
        topic_scores=[],
        strengths=[],
        weaknesses=[],
        results=[
            QuestionResult(question=question, transcript="Answer.", evaluation=evaluation)
            for _ in turns
        ],
        study_plan=[],
        summary_feedback="Summary.",
    )
    return StoredSession(
        id=f"s-{index}",
        user_id="test-user",
        config=config,
        status="completed",
        started_at=(completed_at - datetime.timedelta(minutes=10)).isoformat(),
        completed_at=completed_at.isoformat(),
        blueprint=Blueprint(
            topics=[
                BlueprintTopic(
                    topic=domain,
                    opening_question="Explain the topic.",
                    expected_concepts=[],
                    follow_up_hints=[],
                )
            ]
        ),
        current_question=question,
        turns=turns,
        report=report,
    )


def test_badges_require_three_answered_questions_and_score_threshold():
    now = datetime.datetime.now(datetime.timezone.utc)
    two_answers = make_session(1, now, turn_count=2, score=100)
    progress = evaluate_progress([two_answers])
    assert progress["first_interview"] == 0
    assert progress["score_80"] == 0

    score_79 = make_session(2, now, score=79)
    progress = evaluate_progress([score_79])
    assert progress["first_interview"] == 1
    assert progress["score_80"] == 79
    assert progress["score_90"] == 79

    score_80 = make_session(3, now, score=80)
    assert evaluate_progress([score_80])["score_80"] == 80
    score_89 = make_session(4, now, score=89)
    assert evaluate_progress([score_89])["score_90"] == 89
    score_90 = make_session(5, now, score=90)
    assert evaluate_progress([score_90])["score_90"] == 90


def test_interview_count_badge_progress():
    now = datetime.datetime.now(datetime.timezone.utc)
    sessions = [
        make_session(i, now + datetime.timedelta(seconds=i), score=70)
        for i in range(10)
    ]
    progress = evaluate_progress(sessions)
    assert progress["five_interviews"] == 10
    assert progress["ten_interviews"] == 10


def test_streak_badges_use_longest_practice_streak():
    today = datetime.date(2026, 11, 10)
    six_dates = {today - datetime.timedelta(days=i) for i in range(6)}
    seven_dates = six_dates | {today - datetime.timedelta(days=6)}
    assert longest_streak(six_dates) == 6
    assert longest_streak(seven_dates) == 7

    six_sessions = [
        make_session(i, datetime.datetime.combine(day, datetime.time(12), datetime.timezone.utc))
        for i, day in enumerate(sorted(six_dates))
    ]
    seven_sessions = six_sessions + [
        make_session(
            7,
            datetime.datetime.combine(
                today - datetime.timedelta(days=6),
                datetime.time(12),
                datetime.timezone.utc,
            ),
        )
    ]
    six_progress = evaluate_progress(six_sessions)
    seven_progress = evaluate_progress(seven_sessions)
    assert six_progress["streak_3"] == 6
    assert six_progress["streak_7"] == 6
    assert seven_progress["streak_7"] == 7

    month_dates = {today - datetime.timedelta(days=i) for i in range(30)}
    month_sessions = [
        make_session(
            20 + i,
            datetime.datetime.combine(day, datetime.time(12), datetime.timezone.utc),
        )
        for i, day in enumerate(sorted(month_dates))
    ]
    assert evaluate_progress(month_sessions)["streak_30"] == 30


def test_all_rounder_multilingual_and_comeback_rules():
    now = datetime.datetime.now(datetime.timezone.utc)
    technical = make_session(1, now, interview_type="technical", score=70)
    assert evaluate_progress([technical])["all_rounder"] == 1
    hr = make_session(2, now + datetime.timedelta(days=1), interview_type="hr", language="hi", score=84)
    progress = evaluate_progress([technical, hr])
    assert progress["all_rounder"] == 2
    assert progress["multilingual"] == 2
    assert progress["comeback"] == 14

    comeback = make_session(
        3,
        now + datetime.timedelta(days=2),
        interview_type="technical",
        language="ta",
        score=99,
    )
    # The same-domain comparison is against the immediately preceding score (84).
    assert evaluate_progress([technical, hr, comeback])["comeback"] == 15


def test_week_boundaries_use_asia_kolkata_and_count_interviews():
    sunday_session = make_session(
        1,
        datetime.datetime.fromisoformat("2026-11-15T18:29:59+00:00"),
    )
    monday_session = make_session(
        2,
        datetime.datetime.fromisoformat("2026-11-15T18:30:00+00:00"),
    )
    now = datetime.datetime.fromisoformat("2026-11-15T18:30:00+00:00")
    goal = compute_weekly_goal([sunday_session, monday_session], 1, now)
    assert goal.week_start == "2026-11-16"
    assert goal.week_end == "2026-11-22"
    assert goal.completed_interviews == 1
    assert goal.days_active == [True, False, False, False, False, False, False]


def test_weekly_goal_counts_sessions_and_tracks_week_streak():
    now = datetime.datetime.fromisoformat("2026-11-10T12:00:00+00:00")
    current_monday = datetime.date(2026, 11, 9)
    sessions = []
    for week_offset in (0, -7):
        for index in range(3):
            date = current_monday + datetime.timedelta(days=week_offset, hours=0)
            completed = datetime.datetime.combine(
                date + datetime.timedelta(days=index),
                datetime.time(12),
                datetime.timezone.utc,
            )
            sessions.append(make_session(len(sessions), completed))

    goal = compute_weekly_goal(sessions, 3, now)
    assert goal.completed_interviews == 3
    assert goal.achieved is True
    assert goal.streak_weeks == 2


@pytest.mark.asyncio
async def test_badge_awards_are_idempotent_and_goal_getter_unlocks():
    repo = MemoryRepository()
    now = datetime.datetime.now(datetime.timezone.utc)
    sessions = [
        make_session(i, now + datetime.timedelta(seconds=i), score=80 + i)
        for i in range(3)
    ]
    trigger = sessions[-1]
    for session in sessions:
        await repo.save_session(session)

    first = await award_badges("test-user", trigger, repo)
    second = await award_badges("test-user", trigger, repo)
    earned_ids = {badge.id for badge in first}
    assert {"first_interview", "score_80", "goal_getter"} <= earned_ids
    assert second == []
    assert len(await repo.list_user_badges("test-user")) == len(first)


@pytest.mark.asyncio
async def test_badges_list_recognizes_previously_completed_eligible_badges():
    repo = MemoryRepository()
    now = datetime.datetime.now(datetime.timezone.utc)
    sessions = [
        make_session(i, now + datetime.timedelta(seconds=i), score=85)
        for i in range(3)
    ]
    for session in sessions:
        await repo.save_session(session)

    badges = await list_badges("test-user", repo)
    earned_ids = {badge.id for badge in badges if badge.earned}
    assert {"first_interview", "score_80", "goal_getter"} <= earned_ids
    assert all(badge.earned_at for badge in badges if badge.earned)


def test_goal_routes_default_validation_and_badges_route():
    repo = MemoryRepository()
    app.dependency_overrides[get_repo] = lambda: repo
    try:
        default = client.get("/api/goals/weekly")
        badges = client.get("/api/badges")
        updated = client.put("/api/goals/weekly", json={"targetInterviews": 5})
        invalid_low = client.put("/api/goals/weekly", json={"targetInterviews": 0})
        invalid_high = client.put("/api/goals/weekly", json={"targetInterviews": 15})
    finally:
        app.dependency_overrides.pop(get_repo, None)

    assert default.status_code == 200
    assert default.json()["targetInterviews"] == 3
    assert len(default.json()["daysActive"]) == 7
    assert badges.status_code == 200
    assert len(badges.json()["badges"]) == 13
    assert updated.status_code == 200
    assert updated.json()["targetInterviews"] == 5
    assert invalid_low.status_code == 422
    assert invalid_high.status_code == 422


def test_end_session_includes_empty_new_badges_by_default():
    repo = MemoryRepository()
    session = make_session(100, datetime.datetime.now(datetime.timezone.utc), turn_count=0)
    session.user_id = "dev-user"
    repo._sessions[session.id] = session
    app.dependency_overrides[get_repo] = lambda: repo
    try:
        response = client.post(f"/api/sessions/{session.id}/end")
    finally:
        app.dependency_overrides.pop(get_repo, None)

    assert response.status_code == 200
    assert response.json() == {"sessionId": session.id, "newBadges": []}
