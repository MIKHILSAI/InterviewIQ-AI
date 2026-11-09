"""FastAPI application entrypoint for InterviewIQ AI backend."""

import os
import time
import uuid
import hashlib
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app.errors import (
    AppError,
    request_id_ctx,
    app_error_handler,
    validation_error_handler,
    generic_exception_handler,
)
from app.services.media_store import MediaStore
from app.routers import badges, goals, health, resume, sessions, stats

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
)
logger = logging.getLogger("interviewiq.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle hook managing startup checks and background cleanup."""
    settings = get_settings()
    logger.info("Starting InterviewIQ AI backend [env=%s]", settings.APP_ENV)

    # 1. Startup validation
    if not settings.GNANI_API_KEY and settings.APP_ENV == "production":
        logger.warning("GNANI_API_KEY is not configured! Voice STT and TTS will be inactive.")

    if not settings.AUTH_DISABLED and not settings.CLERK_JWKS_URL:
        logger.warning("CLERK_JWKS_URL is empty while AUTH_DISABLED=False!")

    # 2. Ensure media directory exists and prune expired files
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    media_store = MediaStore()
    cleaned = await media_store.cleanup_expired()
    logger.info("Startup media cleanup removed %d stale audio files.", cleaned)

    yield

    logger.info("Shutting down InterviewIQ AI backend.")


app = FastAPI(
    title="InterviewIQ AI Backend",
    version="1.0.0",
    description="Adaptive multi-turn AI interview platform with real-time Indian English and Tamil speech.",
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------------
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_and_context(request: Request, call_next):
    """Middleware injecting request-id, timing execution, and logging structured metrics."""
    req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request_id_ctx.set(req_id)

    # Hash user identity for privacy in logs
    auth_header = request.headers.get("authorization", "")
    user_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:8] if auth_header else "anon"

    t0 = time.time()
    try:
        response = await call_next(request)
        duration_ms = round((time.time() - t0) * 1000, 2)
        response.headers["x-request-id"] = req_id

        # Skip spamming logs for static media files
        if not request.url.path.startswith("/media"):
            logger.info(
                '{"reqId":"%s","user":"%s","method":"%s","path":"%s","status":%d,"latencyMs":%s}',
                req_id,
                user_hash,
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
        return response
    except Exception as exc:
        duration_ms = round((time.time() - t0) * 1000, 2)
        logger.exception(
            '{"reqId":"%s","user":"%s","method":"%s","path":"%s","status":500,"latencyMs":%s,"error":"%s"}',
            req_id,
            user_hash,
            request.method,
            request.url.path,
            duration_ms,
            str(exc),
        )
        raise exc


# -----------------------------------------------------------------------------
# Exception Handlers
# -----------------------------------------------------------------------------
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# -----------------------------------------------------------------------------
# Static Media Mount & API Routers
# -----------------------------------------------------------------------------
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(stats.router)
app.include_router(resume.router)
app.include_router(badges.router)
app.include_router(goals.router)
