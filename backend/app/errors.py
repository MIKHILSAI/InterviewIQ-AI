"""Standardized error models and exception handlers for FastAPI."""

import logging
from contextvars import ContextVar
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger("interviewiq")
request_id_ctx: ContextVar[str] = ContextVar("request_id_ctx", default="")


class AppError(Exception):
    """Domain exception with an HTTP status code, machine error code, and user message."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    req_id = request_id_ctx.get()
    logger.warning("AppError [%s] %s: %s (req_id=%s)", exc.status_code, exc.code, exc.message, req_id)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": {"code": exc.code, "message": exc.message}},
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    req_id = request_id_ctx.get()
    first_error = exc.errors()[0] if exc.errors() else {}
    msg = first_error.get("msg", "Invalid request parameters.")
    loc = " -> ".join(str(l) for l in first_error.get("loc", []))
    full_msg = f"{loc}: {msg}" if loc else msg

    logger.warning("ValidationError: %s (req_id=%s)", full_msg, req_id)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": {"code": "VALIDATION_ERROR", "message": full_msg}},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    req_id = request_id_ctx.get()
    logger.exception("Unhandled Server Exception (req_id=%s): %s", req_id, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
            }
        },
    )
