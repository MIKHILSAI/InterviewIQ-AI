"""Integration tests for FastAPI routes, camelCase serialization contract, and validation."""

import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings
from app.db.memory import MemoryRepository
from app.deps import get_repo
from app.schemas import (
    Blueprint,
    BlueprintTopic,
    InterviewConfig,
    Question,
    ResumeProfileData,
    StoredSession,
)
from app.services.stats import compute_streak


@pytest.fixture(autouse=True)
def test_env(monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("STORAGE_BACKEND", "memory")
    get_settings.cache_clear()


client = TestClient(app)


def assert_camel_case_keys(data):
    """Recursively asserts that dictionary keys do not contain snake_case underscores."""
    if isinstance(data, dict):
        for k, v in data.items():
            assert "_" not in k, f"Key '{k}' is snake_case! All API responses must be camelCase."
            assert_camel_case_keys(v)
    elif isinstance(data, list):
        for item in data:
            assert_camel_case_keys(item)


def test_health_route():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert_camel_case_keys(data)


def test_hindi_session_creation(monkeypatch):
    class FakeEngine:
        last_resume_profile = None

        async def build_blueprint(self, config, resume_profile=None):
            FakeEngine.last_resume_profile = resume_profile
            return Blueprint(
                topics=[
                    BlueprintTopic(
                        topic="Python",
                        opening_question="Python में अपने अनुभव के बारे में बताइए।",
                        expected_concepts=["Python"],
                        follow_up_hints=[],
                    )
                ]
            )

    class FakeTTS:
        async def synthesize_safe(self, text, language):
            return None

    repo = MemoryRepository()
    import asyncio

    asyncio.run(
        repo.save_resume_profile(
            "dev-user",
            ResumeProfileData(
                summary="Backend engineer",
                skills=["Python"],
                experience=["Built APIs"],
                projects=["Interview service"],
                education=[],
            ),
        )
    )
    app.dependency_overrides[get_repo] = lambda: repo
    monkeypatch.setattr("app.routers.sessions.InterviewEngine", FakeEngine)
    monkeypatch.setattr("app.routers.sessions.GnaniTTS", FakeTTS)
    try:
        res = client.post(
            "/api/sessions",
            json={
                "type": "technical",
                "domain": "Python",
                "difficulty": "intermediate",
                "durationMin": 5,
                "language": "hi",
            },
        )
    finally:
        app.dependency_overrides.pop(get_repo, None)

    assert res.status_code == 200
    assert res.json()["config"]["language"] == "hi"
    assert "Python" in res.json()["firstQuestion"]["text"]
    assert FakeEngine.last_resume_profile is not None
    assert FakeEngine.last_resume_profile.skills == ["Python"]


def test_invalid_duration_rejection():
    payload = {
        "type": "technical",
        "domain": "Python",
        "difficulty": "intermediate",
        "durationMin": 25,  # Invalid duration
        "language": "en",
    }
    res = client.post("/api/sessions", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert data["detail"]["code"] in ("INVALID_DURATION", "VALIDATION_ERROR")


def test_streak_calculation():
    today = datetime.datetime.now(datetime.timezone.utc).date()
    yesterday = today - datetime.timedelta(days=1)
    day_before = today - datetime.timedelta(days=2)

    # 3-day streak active today
    assert compute_streak({today, yesterday, day_before}) == 3

    # 2-day streak ending yesterday
    assert compute_streak({yesterday, day_before}) == 2

    # Broken streak
    old_date = today - datetime.timedelta(days=5)
    assert compute_streak({old_date}) == 0


def test_empty_stats_route():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["totalInterviews"] == 0
    assert data["avgScore"] == 0
    assert data["trend"] == []
    assert data["weakTopics"] == []
    assert_camel_case_keys(data)


def test_empty_sessions_route():
    app.dependency_overrides[get_repo] = MemoryRepository
    try:
        res = client.get("/api/sessions")
    finally:
        app.dependency_overrides.pop(get_repo, None)

    assert res.status_code == 200
    assert res.json() == []


def test_resume_upload_get_and_delete(monkeypatch):
    profile = ResumeProfileData(
        summary="Backend engineer",
        skills=["Python"],
        experience=["Built APIs"],
        projects=[],
        education=[],
    )

    async def fake_extract_resume_profile(data, extension):
        assert data == b"PKfake-docx"
        assert extension == ".docx"
        return profile

    repo = MemoryRepository()
    app.dependency_overrides[get_repo] = lambda: repo
    monkeypatch.setattr("app.routers.resume.extract_resume_profile", fake_extract_resume_profile)
    try:
        uploaded = client.post(
            "/api/resume/profile",
            files={
                "file": (
                    "resume.docx",
                    b"PKfake-docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        )
        retrieved = client.get("/api/resume/profile")
        deleted = client.delete("/api/resume/profile")
        missing = client.get("/api/resume/profile")
    finally:
        app.dependency_overrides.pop(get_repo, None)

    assert uploaded.status_code == 200
    assert uploaded.json()["skills"] == ["Python"]
    assert retrieved.json()["summary"] == "Backend engineer"
    assert deleted.status_code == 204
    assert missing.json() is None


def test_submit_answer_loads_session_for_current_user():
    repo = MemoryRepository()
    session = StoredSession(
        id="session-for-answer-test",
        user_id="dev-user",
        config=InterviewConfig(
            type="technical",
            domain="Python",
            difficulty="intermediate",
            duration_min=5,
            language="en",
        ),
        status="in_progress",
        started_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        blueprint=Blueprint(
            topics=[
                BlueprintTopic(
                    topic="Python",
                    opening_question="Explain Python.",
                    expected_concepts=["Python"],
                    follow_up_hints=[],
                )
            ]
        ),
        current_question=Question(
            id="current-question",
            text="Explain Python.",
            topic="Python",
            is_follow_up=False,
            index=0,
        ),
    )
    repo._sessions[session.id] = session
    app.dependency_overrides[get_repo] = lambda: repo
    try:
        res = client.post(
            f"/api/sessions/{session.id}/answer",
            data={"questionId": "stale-question"},
            files={"audio": ("answer.webm", b"audio", "audio/webm")},
        )
    finally:
        app.dependency_overrides.pop(get_repo, None)

    assert res.status_code == 409
    assert res.json()["detail"]["code"] == "QUESTION_MISMATCH"
