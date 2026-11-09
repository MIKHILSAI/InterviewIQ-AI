"""Authenticated resume profile upload and management endpoints."""

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response

from app.auth.clerk import get_current_user
from app.db.base import Repository
from app.deps import get_repo
from app.errors import AppError
from app.schemas import ResumeProfileData
from app.services.resume import MAX_RESUME_BYTES, extract_resume_profile

router = APIRouter(prefix="/api/resume/profile", tags=["Resume"])


@router.get("", response_model=ResumeProfileData | None, response_model_by_alias=True)
async def get_resume_profile(
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> ResumeProfileData | None:
    stored = await repo.get_resume_profile(user_id)
    if not stored:
        return None
    return ResumeProfileData(**stored.model_dump(exclude={"user_id", "updated_at"}))


@router.post("", response_model=ResumeProfileData, response_model_by_alias=True)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> ResumeProfileData:
    filename = (file.filename or "").lower()
    extension = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""
    if extension not in {".pdf", ".docx"}:
        raise AppError(415, "UNSUPPORTED_RESUME", "Upload a PDF or DOCX resume.")

    data = await file.read(MAX_RESUME_BYTES + 1)
    await file.close()
    if len(data) > MAX_RESUME_BYTES:
        raise AppError(413, "RESUME_TOO_LARGE", "Resume files must be 5 MB or smaller.")

    profile = await extract_resume_profile(data, extension)
    await repo.save_resume_profile(user_id, profile)
    return profile


@router.delete("", status_code=204)
async def delete_resume_profile(
    user_id: str = Depends(get_current_user),
    repo: Repository = Depends(get_repo),
) -> Response:
    await repo.delete_resume_profile(user_id)
    return Response(status_code=204)
