"""Badge progress endpoint."""

from fastapi import APIRouter, Depends

from app.auth.clerk import get_current_user
from app.db.base import Repository
from app.deps import get_repo
from app.schemas import BadgesResponse
from app.services.badges import list_badges

router = APIRouter(prefix="/api/badges", tags=["Badges"])


@router.get("", response_model=BadgesResponse, response_model_by_alias=True)
async def get_badges(
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> BadgesResponse:
    return BadgesResponse(badges=await list_badges(user_id, repo))
