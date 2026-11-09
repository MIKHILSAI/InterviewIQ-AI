import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.auth.clerk import get_current_user
from app.errors import AppError


@pytest.mark.asyncio
@pytest.mark.parametrize(("issued_in", "accepted"), [(10, True), (31, False)])
async def test_clerk_token_allows_only_small_clock_skew(monkeypatch, issued_in, accepted):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    now = int(time.time())
    token = jwt.encode(
        {
            "iss": "https://example.clerk.accounts.dev",
            "sub": "user_test",
            "iat": now + issued_in,
            "exp": now + 600,
        },
        private_key,
        algorithm="RS256",
    )

    class FakeJWKClient:
        def get_signing_key_from_jwt(self, _token):
            return SimpleNamespace(key=public_key)

    monkeypatch.setattr(
        "app.auth.clerk.get_settings",
        lambda: SimpleNamespace(
            AUTH_DISABLED=False,
            CLERK_JWKS_URL="https://example.clerk.accounts.dev/.well-known/jwks.json",
            CLERK_ISSUER="https://example.clerk.accounts.dev",
            CLERK_AUTHORIZED_PARTIES="",
        ),
    )
    monkeypatch.setattr("app.auth.clerk.get_jwk_client", lambda _url: FakeJWKClient())

    if accepted:
        assert await get_current_user(f"Bearer {token}") == "user_test"
    else:
        with pytest.raises(AppError) as error:
            await get_current_user(f"Bearer {token}")
        assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_clerk_token_rejects_expired_token_even_with_clock_skew(monkeypatch):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    now = int(time.time())
    token = jwt.encode(
        {
            "iss": "https://example.clerk.accounts.dev",
            "sub": "user_test",
            "iat": now - 600,
            "exp": now - 10,
        },
        private_key,
        algorithm="RS256",
    )

    class FakeJWKClient:
        def get_signing_key_from_jwt(self, _token):
            return SimpleNamespace(key=public_key)

    monkeypatch.setattr(
        "app.auth.clerk.get_settings",
        lambda: SimpleNamespace(
            AUTH_DISABLED=False,
            CLERK_JWKS_URL="https://example.clerk.accounts.dev/.well-known/jwks.json",
            CLERK_ISSUER="https://example.clerk.accounts.dev",
            CLERK_AUTHORIZED_PARTIES="",
        ),
    )
    monkeypatch.setattr("app.auth.clerk.get_jwk_client", lambda _url: FakeJWKClient())

    with pytest.raises(AppError) as error:
        await get_current_user(f"Bearer {token}")
    assert error.value.status_code == 401
