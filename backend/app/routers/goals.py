"""Weekly interview goal endpoints."""

import datetime
from fastapi import APIRouter, Depends

from app.auth.clerk import get_current_user
from app.db.base import Repository
from app.deps import get_repo
from app.schemas import SetGoalRequest, WeeklyGoal
from app.services.badges import maybe_award_goal_getter
from app.services.goals import compute_weekly_goal, get_weekly_goal

router = APIRouter(prefix="/api/goals/weekly", tags=["Goals"])


@router.get("", response_model=WeeklyGoal, response_model_by_alias=True)
async def read_weekly_goal(
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> WeeklyGoal:
    return await get_weekly_goal(user_id, repo)


@router.put("", response_model=WeeklyGoal, response_model_by_alias=True)
async def update_weekly_goal(
    request: SetGoalRequest,
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> WeeklyGoal:
    saved = await repo.save_weekly_goal(user_id, request.target_interviews)
    sessions = await repo.list_sessions(user_id)
    goal = compute_weekly_goal(sessions, request.target_interviews)
    if goal.achieved:
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if not saved.goal_achieved_at:
            await repo.save_weekly_goal(user_id, request.target_interviews, timestamp)
        await maybe_award_goal_getter(user_id, sessions, repo)
    return goal
