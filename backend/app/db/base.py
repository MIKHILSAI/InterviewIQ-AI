"""Repository protocol defining session persistence operations."""

from typing import Protocol
from app.schemas import (
    BadgeId,
    ResumeProfileData,
    StoredResumeProfile,
    StoredSession,
    StoredUserBadge,
    StoredWeeklyGoal,
)


class Repository(Protocol):
    """Abstract repository for persisting InterviewIQ sessions."""

    async def create_session(self, session: StoredSession) -> StoredSession:
        """Stores a newly initialized session."""
        ...

    async def get_session(self, session_id: str, user_id: str) -> StoredSession | None:
        """Retrieves an existing session belonging to user_id."""
        ...

    async def save_session(self, session: StoredSession) -> StoredSession:
        """Updates and persists changes to an existing session."""
        ...

    async def list_sessions(self, user_id: str) -> list[StoredSession]:
        """Lists all sessions for a user, sorted newest first."""
        ...

    async def get_resume_profile(self, user_id: str) -> StoredResumeProfile | None:
        """Returns a user's extracted resume profile, if one exists."""
        ...

    async def save_resume_profile(
        self, user_id: str, profile: ResumeProfileData
    ) -> StoredResumeProfile:
        """Persists extracted resume details without retaining the uploaded file."""
        ...

    async def delete_resume_profile(self, user_id: str) -> None:
        """Deletes a user's extracted resume profile."""
        ...

    async def list_user_badges(self, user_id: str) -> list[StoredUserBadge]:
        """Lists badges earned by a user."""
        ...

    async def add_user_badge(
        self, user_id: str, badge_id: BadgeId, earned_at: str, session_id: str | None
    ) -> bool:
        """Adds an earned badge once; returns whether it was newly added."""
        ...

    async def get_weekly_goal(self, user_id: str) -> StoredWeeklyGoal | None:
        """Returns a user's saved weekly interview goal."""
        ...

    async def save_weekly_goal(
        self, user_id: str, target_interviews: int, goal_achieved_at: str | None = None
    ) -> StoredWeeklyGoal:
        """Saves a user's target while retaining the first goal-achieved timestamp."""
        ...
