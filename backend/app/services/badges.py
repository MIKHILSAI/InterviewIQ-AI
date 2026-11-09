"""Progress calculation and idempotent badge awards."""

import datetime
import asyncio
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.db.base import Repository
from app.schemas import (
    Badge,
    BadgeId,
    StoredSession,
    StoredUserBadge,
)
from app.services.stats import longest_streak

BADGE_DEFINITIONS: list[tuple[BadgeId, str, str, int]] = [
    ("first_interview", "First Steps", "Complete your first eligible interview.", 1),
    ("five_interviews", "Getting Comfortable", "Complete five eligible interviews.", 5),
    ("ten_interviews", "Interview Regular", "Complete ten eligible interviews.", 10),
    ("streak_3", "Three-Day Streak", "Practice on three consecutive days.", 3),
    ("streak_7", "Week of Practice", "Practice on seven consecutive days.", 7),
    ("streak_30", "Month of Momentum", "Practice on thirty consecutive days.", 30),
    ("score_80", "Strong Performance", "Score at least 80 in an eligible interview.", 80),
    ("score_90", "Excellent Performance", "Score at least 90 in an eligible interview.", 90),
    ("all_rounder", "All-Rounder", "Complete both a technical and an HR interview.", 2),
    ("multilingual", "Multilingual", "Complete interviews in two different languages.", 2),
    ("comeback", "Comeback", "Improve by at least 15 points in the same domain.", 15),
    ("goal_getter", "Goal Getter", "Achieve your weekly interview target.", 1),
    ("code_and_talk", "Code and Talk", "Complete a coding round with both spoken reasoning and a reviewed solution.", 1),
]


def _qualifies_code_and_talk(session: StoredSession) -> bool:
    state = session.coding_state
    return bool(
        session.status == "completed"
        and state
        and state.approach_transcript.strip()
        and state.submitted_code
        and state.review
    )


def qualifying_sessions(sessions: list[StoredSession]) -> list[StoredSession]:
    return [
        session
        for session in sessions
        if session.status == "completed" and len(session.turns) >= 3
    ]


def _completed_date(session: StoredSession, timezone: ZoneInfo) -> datetime.date | None:
    if not session.completed_at:
        return None
    completed = datetime.datetime.fromisoformat(
        session.completed_at.replace("Z", "+00:00")
    )
    if completed.tzinfo is None:
        completed = completed.replace(tzinfo=datetime.timezone.utc)
    return completed.astimezone(timezone).date()


def evaluate_progress(sessions: list[StoredSession]) -> dict[BadgeId, int]:
    completed = qualifying_sessions(sessions)
    timezone = ZoneInfo(get_settings().DEFAULT_TIMEZONE)
    dates = {
        date
        for session in completed
        if (date := _completed_date(session, timezone)) is not None
    }
    scores = [
        (session, session.report.overall_score)
        for session in completed
        if session.report is not None
    ]

    all_rounder = {
        session.config.type
        for session in completed
        if session.config.type in {"technical", "hr"}
    }
    languages = {session.config.language for session in completed}
    domain_scores: dict[str, int] = {}
    max_comeback = 0
    for session, score in sorted(
        scores,
        key=lambda item: item[0].completed_at or item[0].started_at,
    ):
        previous_score = domain_scores.get(session.config.domain)
        if previous_score is not None:
            max_comeback = max(max_comeback, score - previous_score)
        domain_scores[session.config.domain] = score

    return {
        "first_interview": len(completed),
        "five_interviews": len(completed),
        "ten_interviews": len(completed),
        "streak_3": longest_streak(dates),
        "streak_7": longest_streak(dates),
        "streak_30": longest_streak(dates),
        "score_80": max((score for _, score in scores), default=0),
        "score_90": max((score for _, score in scores), default=0),
        "all_rounder": len(all_rounder),
        "multilingual": len(languages),
        "comeback": max_comeback,
        "goal_getter": 0,
        "code_and_talk": sum(_qualifies_code_and_talk(session) for session in sessions),
    }


def _to_badges(
    sessions: list[StoredSession],
    saved: list[StoredUserBadge],
) -> list[Badge]:
    progress = evaluate_progress(sessions)
    earned_by_id = {badge.badge_id: badge for badge in saved}
    if "goal_getter" in earned_by_id:
        progress["goal_getter"] = 1
    return [
        Badge(
            id=badge_id,
            name=name,
            description=description,
            target=target,
            current=progress[badge_id],
            earned=badge_id in earned_by_id,
            earned_at=earned_by_id[badge_id].earned_at if badge_id in earned_by_id else None,
        )
        for badge_id, name, description, target in BADGE_DEFINITIONS
    ]


async def list_badges(user_id: str, repo: Repository) -> list[Badge]:
    sessions, saved = await _load_user_data(user_id, repo)
    progress = evaluate_progress(sessions)
    saved_ids = {badge.badge_id for badge in saved}
    eligible_sessions = qualifying_sessions(sessions)
    trigger_session = max(
        eligible_sessions,
        key=lambda session: session.completed_at or session.started_at,
        default=None,
    )
    code_session = max(
        (session for session in sessions if _qualifies_code_and_talk(session)),
        key=lambda session: session.completed_at or session.started_at,
        default=None,
    )
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    for badge_id, _, _, target in BADGE_DEFINITIONS:
        if (
            badge_id != "goal_getter"
            and progress[badge_id] >= target
            and badge_id not in saved_ids
        ):
            badge_session = code_session if badge_id == "code_and_talk" else trigger_session
            await repo.add_user_badge(
                user_id,
                badge_id,
                now,
                badge_session.id if badge_session else None,
            )

    await _ensure_goal_getter(user_id, sessions, repo, trigger_session)
    saved = await repo.list_user_badges(user_id)
    return _to_badges(sessions, saved)


async def _load_user_data(
    user_id: str,
    repo: Repository,
) -> tuple[list[StoredSession], list[StoredUserBadge]]:
    return await asyncio.gather(repo.list_sessions(user_id), repo.list_user_badges(user_id))


async def _ensure_goal_getter(
    user_id: str,
    sessions: list[StoredSession],
    repo: Repository,
    trigger_session: StoredSession | None,
) -> StoredUserBadge | None:
    from app.services.goals import compute_weekly_goal

    stored_goal = await repo.get_weekly_goal(user_id)
    target = stored_goal.target_interviews if stored_goal else 3
    weekly = compute_weekly_goal(sessions, target_interviews=target)
    if not weekly.achieved:
        return None

    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if not stored_goal or not stored_goal.goal_achieved_at:
        await repo.save_weekly_goal(user_id, target, now)
    added = await repo.add_user_badge(
        user_id,
        "goal_getter",
        now,
        trigger_session.id if trigger_session else None,
    )
    if not added:
        return None
    return StoredUserBadge(
        user_id=user_id,
        badge_id="goal_getter",
        earned_at=now,
        session_id=trigger_session.id if trigger_session else None,
    )


async def maybe_award_goal_getter(
    user_id: str,
    sessions: list[StoredSession],
    repo: Repository,
    trigger_session: StoredSession | None = None,
) -> bool:
    return await _ensure_goal_getter(user_id, sessions, repo, trigger_session) is not None


async def award_badges(
    user_id: str,
    trigger_session: StoredSession,
    repo: Repository,
) -> list[Badge]:
    is_eligible_code_round = _qualifies_code_and_talk(trigger_session)
    if (
        trigger_session.status != "completed"
        or (len(trigger_session.turns) < 3 and not is_eligible_code_round)
    ):
        return []

    sessions = await repo.list_sessions(user_id)
    goal_badge = await _ensure_goal_getter(user_id, sessions, repo, trigger_session)
    saved = await repo.list_user_badges(user_id)
    progress = evaluate_progress(sessions)
    earned: list[Badge] = []
    saved_ids = {badge.badge_id for badge in saved}

    for badge_id, name, description, target in BADGE_DEFINITIONS:
        if badge_id == "goal_getter":
            stored = goal_badge
            if stored is None:
                continue
        elif (
            progress[badge_id] >= target
            and badge_id not in saved_ids
            and (
                badge_id != "code_and_talk"
                or is_eligible_code_round
            )
        ):
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            if not await repo.add_user_badge(user_id, badge_id, now, trigger_session.id):
                continue
            stored = StoredUserBadge(
                user_id=user_id,
                badge_id=badge_id,
                earned_at=now,
                session_id=trigger_session.id,
            )
        else:
            continue
        earned.append(
            Badge(
                id=badge_id,
                name=name,
                description=description,
                target=target,
                current=progress[badge_id] if badge_id != "goal_getter" else 1,
                earned=True,
                earned_at=stored.earned_at,
            )
        )
    return earned
