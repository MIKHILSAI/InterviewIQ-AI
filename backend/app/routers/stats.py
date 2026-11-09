"""Dashboard analytics router."""

from fastapi import APIRouter, Depends
from app.auth.clerk import get_current_user
from app.db.base import Repository
from app.deps import get_repo
from app.schemas import DashboardStats
from app.services.stats import calculate_dashboard_stats

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("", response_model=DashboardStats, response_model_by_alias=True)
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> DashboardStats:
    """Returns aggregated interview analytics, score trends, streak, and weak topics."""
    sessions = await repo.list_sessions(user_id)
    return calculate_dashboard_stats(sessions)
