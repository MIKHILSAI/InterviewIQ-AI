"""Motor MongoDB repository implementation."""

from datetime import datetime, timezone, timedelta
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.schemas import (
    BadgeId,
    ResumeProfileData,
    StoredResumeProfile,
    StoredSession,
    StoredUserBadge,
    StoredWeeklyGoal,
)


class MongoRepository:
    """MongoDB implementation of Repository protocol using motor."""

    def __init__(self, uri: str, db_name: str = "interviewiq"):
        self.client: AsyncIOMotorClient = AsyncIOMotorClient(uri)
        self.db: AsyncIOMotorDatabase = self.client[db_name]
        self.collection = self.db.sessions
        self.resume_profiles = self.db.resume_profiles
        self.user_badges = self.db.user_badges
        self.user_goals = self.db.user_goals
        self._badge_indexes_initialized = False

    async def init_indexes(self):
        """Creates compound index on userId + startedAt."""
        await self.collection.create_index([("userId", 1), ("startedAt", -1)])
        await self.user_badges.create_index(
            [("userId", 1), ("badgeId", 1)], unique=True
        )
        self._badge_indexes_initialized = True

    def _apply_inactivity_check(self, session: StoredSession) -> StoredSession:
        if session.status == "in_progress":
            try:
                started = datetime.fromisoformat(session.started_at.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) - started > timedelta(hours=2):
                    data = session.model_dump()
                    data["status"] = "abandoned"
                    return StoredSession.model_validate(data)
            except Exception:
                pass
        return session

    async def create_session(self, session: StoredSession) -> StoredSession:
        doc = session.model_dump(by_alias=True, mode="json")
        doc["_id"] = session.id
        await self.collection.insert_one(doc)
        return session

    async def get_session(self, session_id: str, user_id: str) -> StoredSession | None:
        doc = await self.collection.find_one({"_id": session_id, "userId": user_id})
        if not doc:
            return None
        doc.pop("_id", None)
        session = StoredSession.model_validate(doc)
        return self._apply_inactivity_check(session)

    async def save_session(self, session: StoredSession) -> StoredSession:
        doc = session.model_dump(by_alias=True, mode="json")
        doc["_id"] = session.id
        await self.collection.replace_one({"_id": session.id}, doc, upsert=True)
        return session

    async def list_sessions(self, user_id: str) -> list[StoredSession]:
        cursor = self.collection.find({"userId": user_id}).sort("startedAt", -1)
        sessions = []
        async for doc in cursor:
            doc.pop("_id", None)
            session = StoredSession.model_validate(doc)
            sessions.append(self._apply_inactivity_check(session))
        return sessions

    async def get_resume_profile(self, user_id: str) -> StoredResumeProfile | None:
        doc = await self.resume_profiles.find_one({"_id": user_id})
        if not doc:
            return None
        doc.pop("_id", None)
        return StoredResumeProfile.model_validate(doc)

    async def save_resume_profile(
        self, user_id: str, profile: ResumeProfileData
    ) -> StoredResumeProfile:
        stored = StoredResumeProfile(
            **profile.model_dump(),
            user_id=user_id,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        doc = stored.model_dump(by_alias=True, mode="json")
        doc["_id"] = user_id
        await self.resume_profiles.replace_one({"_id": user_id}, doc, upsert=True)
        return stored

    async def delete_resume_profile(self, user_id: str) -> None:
        await self.resume_profiles.delete_one({"_id": user_id})

    async def list_user_badges(self, user_id: str) -> list[StoredUserBadge]:
        badges: list[StoredUserBadge] = []
        async for doc in self.user_badges.find({"userId": user_id}):
            doc.pop("_id", None)
            badges.append(StoredUserBadge.model_validate(doc))
        return badges

    async def add_user_badge(
        self, user_id: str, badge_id: BadgeId, earned_at: str, session_id: str | None
    ) -> bool:
        if not self._badge_indexes_initialized:
            await self.init_indexes()
        doc = StoredUserBadge(
            user_id=user_id,
            badge_id=badge_id,
            earned_at=earned_at,
            session_id=session_id,
        ).model_dump(by_alias=True, mode="json")
        try:
            await self.user_badges.insert_one(doc)
        except DuplicateKeyError:
            return False
        return True

    async def get_weekly_goal(self, user_id: str) -> StoredWeeklyGoal | None:
        doc = await self.user_goals.find_one({"_id": user_id})
        if not doc:
            return None
        doc.pop("_id", None)
        return StoredWeeklyGoal.model_validate(doc)

    async def save_weekly_goal(
        self, user_id: str, target_interviews: int, goal_achieved_at: str | None = None
    ) -> StoredWeeklyGoal:
        existing = await self.get_weekly_goal(user_id)
        stored = StoredWeeklyGoal(
            user_id=user_id,
            target_interviews=target_interviews,
            goal_achieved_at=(
                existing.goal_achieved_at if existing and existing.goal_achieved_at else goal_achieved_at
            ),
        )
        doc = stored.model_dump(by_alias=True, mode="json")
        doc["_id"] = user_id
        await self.user_goals.replace_one({"_id": user_id}, doc, upsert=True)
        return stored
