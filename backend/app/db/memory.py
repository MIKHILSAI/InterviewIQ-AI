"""In-memory repository implementation for local testing and serverless instances."""

from datetime import datetime, timezone, timedelta
from app.schemas import (
    BadgeId,
    ResumeProfileData,
    StoredResumeProfile,
    StoredSession,
    StoredUserBadge,
    StoredWeeklyGoal,
)


class MemoryRepository:
    """Thread-safe in-memory session repository."""

    def __init__(self):
        self._sessions: dict[str, StoredSession] = {}
        self._resume_profiles: dict[str, StoredResumeProfile] = {}
        self._user_badges: dict[tuple[str, BadgeId], StoredUserBadge] = {}
        self._weekly_goals: dict[str, StoredWeeklyGoal] = {}

    def _apply_inactivity_check(self, session: StoredSession) -> StoredSession:
        """If session has been in_progress for >2 hours, treat as abandoned for reads."""
        if session.status == "in_progress":
            try:
                started = datetime.fromisoformat(session.started_at.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) - started > timedelta(hours=2):
                    # Return modified copy without overwriting original unless updated
                    data = session.model_dump()
                    data["status"] = "abandoned"
                    return StoredSession.model_validate(data)
            except Exception:
                pass
        return session

    async def create_session(self, session: StoredSession) -> StoredSession:
        self._sessions[session.id] = session
        return session

    async def get_session(self, session_id: str, user_id: str) -> StoredSession | None:
        session = self._sessions.get(session_id)
        if session and session.user_id == user_id:
            return self._apply_inactivity_check(session)
        return None

    async def save_session(self, session: StoredSession) -> StoredSession:
        self._sessions[session.id] = session
        return session

    async def list_sessions(self, user_id: str) -> list[StoredSession]:
        matching = [
            self._apply_inactivity_check(s)
            for s in self._sessions.values()
            if s.user_id == user_id
        ]
        # Sort newest first
        matching.sort(key=lambda s: s.started_at, reverse=True)
        return matching

    async def get_resume_profile(self, user_id: str) -> StoredResumeProfile | None:
        return self._resume_profiles.get(user_id)

    async def save_resume_profile(
        self, user_id: str, profile: ResumeProfileData
    ) -> StoredResumeProfile:
        stored = StoredResumeProfile(
            **profile.model_dump(),
            user_id=user_id,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        self._resume_profiles[user_id] = stored
        return stored

    async def delete_resume_profile(self, user_id: str) -> None:
        self._resume_profiles.pop(user_id, None)

    async def list_user_badges(self, user_id: str) -> list[StoredUserBadge]:
        return [badge for (owner, _), badge in self._user_badges.items() if owner == user_id]

    async def add_user_badge(
        self, user_id: str, badge_id: BadgeId, earned_at: str, session_id: str | None
    ) -> bool:
        key = (user_id, badge_id)
        if key in self._user_badges:
            return False
        self._user_badges[key] = StoredUserBadge(
            user_id=user_id,
            badge_id=badge_id,
            earned_at=earned_at,
            session_id=session_id,
        )
        return True

    async def get_weekly_goal(self, user_id: str) -> StoredWeeklyGoal | None:
        return self._weekly_goals.get(user_id)

    async def save_weekly_goal(
        self, user_id: str, target_interviews: int, goal_achieved_at: str | None = None
    ) -> StoredWeeklyGoal:
        existing = self._weekly_goals.get(user_id)
        stored = StoredWeeklyGoal(
            user_id=user_id,
            target_interviews=target_interviews,
            goal_achieved_at=(
                existing.goal_achieved_at if existing and existing.goal_achieved_at else goal_achieved_at
            ),
        )
        self._weekly_goals[user_id] = stored
        return stored
