"""Timezone-aware weekly interview goal calculations."""

import datetime
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.db.base import Repository
from app.schemas import StoredSession, WeeklyGoal


def _as_local_datetime(value: str, timezone: ZoneInfo) -> datetime.datetime:
    parsed = datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)
    return parsed.astimezone(timezone)


def _qualifies(session: StoredSession) -> bool:
    return session.status == "completed" and len(session.turns) >= 3 and bool(session.completed_at)


def compute_weekly_goal(
    sessions: list[StoredSession],
    target_interviews: int = 3,
    now: datetime.datetime | None = None,
    timezone_name: str | None = None,
) -> WeeklyGoal:
    if not 1 <= target_interviews <= 14:
        raise ValueError("Weekly interview target must be from 1 to 14.")
    timezone = ZoneInfo(timezone_name or get_settings().DEFAULT_TIMEZONE)
    local_now = now or datetime.datetime.now(timezone)
    if local_now.tzinfo is None:
        local_now = local_now.replace(tzinfo=timezone)
    local_now = local_now.astimezone(timezone)

    monday = local_now.date() - datetime.timedelta(days=local_now.weekday())
    sunday = monday + datetime.timedelta(days=6)
    activity_dates: list[datetime.date] = []
    for session in sessions:
        if _qualifies(session):
            activity_dates.append(_as_local_datetime(session.completed_at or "", timezone).date())

    days_active = [
        monday + datetime.timedelta(days=offset) in activity_dates
        for offset in range(7)
    ]
    current_count = sum(
        1
        for activity_date in activity_dates
        if monday <= activity_date <= sunday
    )
    achieved = current_count >= target_interviews

    counts_by_week: dict[datetime.date, int] = {}
    for activity_date in activity_dates:
        week_start = activity_date - datetime.timedelta(days=activity_date.weekday())
        counts_by_week[week_start] = counts_by_week.get(week_start, 0) + 1

    streak_weeks = 0
    week_cursor = monday
    while counts_by_week.get(week_cursor, 0) >= target_interviews:
        streak_weeks += 1
        week_cursor -= datetime.timedelta(days=7)

    return WeeklyGoal(
        target_interviews=target_interviews,
        completed_interviews=current_count,
        week_start=monday.isoformat(),
        week_end=sunday.isoformat(),
        days_active=days_active,
        achieved=achieved,
        streak_weeks=streak_weeks,
    )


async def get_weekly_goal(
    user_id: str,
    repo: Repository,
    now: datetime.datetime | None = None,
) -> WeeklyGoal:
    saved_goal = await repo.get_weekly_goal(user_id)
    sessions = await repo.list_sessions(user_id)
    return compute_weekly_goal(
        sessions,
        target_interviews=saved_goal.target_interviews if saved_goal else 3,
        now=now,
    )
