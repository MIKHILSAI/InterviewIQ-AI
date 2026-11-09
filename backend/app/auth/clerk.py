"""Clerk JWT authentication dependency for FastAPI."""

import logging
import time
from typing import Annotated
import jwt
from jwt import PyJWKClient, PyJWTError
from fastapi import Header, Depends

from app.config import get_settings
from app.errors import AppError

logger = logging.getLogger("interviewiq.auth")
_jwk_client: PyJWKClient | None = None


def get_jwk_client(jwks_url: str) -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwk_client


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Verifies Clerk JWT and returns user ID (sub claim)."""
    settings = get_settings()

    if settings.AUTH_DISABLED:
        return "dev-user"

    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            message="Missing or malformed Authorization header.",
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        raise AppError(status_code=401, code="UNAUTHORIZED", message="Empty authentication token.")

    if not settings.CLERK_JWKS_URL:
        logger.error("CLERK_JWKS_URL is not configured while AUTH_DISABLED=False.")
        raise AppError(
            status_code=500,
            code="CONFIG_ERROR",
            message="Authentication service is not properly configured.",
        )

    try:
        client = get_jwk_client(settings.CLERK_JWKS_URL)
        signing_key = client.get_signing_key_from_jwt(token)

        decode_options = {"verify_signature": True, "verify_exp": True}
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options=decode_options,
            leeway=30,
        )
        expires_at = payload.get("exp")
        if isinstance(expires_at, (int, float)) and expires_at <= time.time():
            raise jwt.ExpiredSignatureError("Signature has expired.")

        # Validate issuer if configured
        if settings.CLERK_ISSUER and payload.get("iss") != settings.CLERK_ISSUER:
            raise AppError(status_code=401, code="UNAUTHORIZED", message="Token issuer mismatch.")

        # Validate authorized parties (azp) if configured
        if settings.CLERK_AUTHORIZED_PARTIES:
            allowed_azps = [a.strip() for a in settings.CLERK_AUTHORIZED_PARTIES.split(",") if a.strip()]
            azp = payload.get("azp")
            if azp and azp not in allowed_azps:
                raise AppError(status_code=401, code="UNAUTHORIZED", message="Authorized party not allowed.")

        sub = payload.get("sub")
        if not sub:
            raise AppError(status_code=401, code="UNAUTHORIZED", message="Token missing subject claim.")

        return str(sub)

    except PyJWTError as err:
        logger.warning("Clerk JWT verification failed: %s", err)
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            message="Invalid or expired authentication credentials.",
        ) from err
