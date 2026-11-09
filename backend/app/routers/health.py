"""Health check endpoints for container and service readiness."""

import shutil
import tempfile
from fastapi import APIRouter, Depends
from app.config import get_settings
from app.errors import AppError
from app.auth.clerk import get_current_user

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", response_model_by_alias=True)
async def health_check():
    """Basic health check endpoint returning 200 OK."""
    return {"status": "ok", "app": "interviewiq-ai"}


@router.get("/deep", response_model_by_alias=True)
async def deep_health_check(user_id: str = Depends(get_current_user)):
    """Deep diagnostics checking ffmpeg availability, writable storage, and database."""
    settings = get_settings()
    diagnostics = {"status": "ok", "checks": {}}

    # 1. Check ffmpeg
    ffmpeg_path = shutil.which("ffmpeg")
    diagnostics["checks"]["ffmpeg"] = {
        "available": ffmpeg_path is not None,
        "path": ffmpeg_path or "not found",
    }

    # 2. Check media directory writable
    try:
        with tempfile.NamedTemporaryFile(dir=settings.MEDIA_DIR, delete=True) as tmp:
            tmp.write(b"probe")
            tmp.flush()
        diagnostics["checks"]["media_storage"] = "writable"
    except Exception as e:
        diagnostics["checks"]["media_storage"] = f"error: {e}"
        diagnostics["status"] = "degraded"

    # 3. Check Mongo if enabled
    if settings.STORAGE_BACKEND == "mongo":
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
            await client.admin.command("ping")
            diagnostics["checks"]["database"] = "connected"
        except Exception as e:
            diagnostics["checks"]["database"] = f"error: {e}"
            diagnostics["status"] = "degraded"
    else:
        diagnostics["checks"]["database"] = "memory_ok"

    return diagnostics
