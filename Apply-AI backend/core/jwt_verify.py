"""
=========================================================
ApplyAI - Supabase token verification
=========================================================

get_current_user previously called supabase.auth.get_user(token) on every
request - a live HTTPS round-trip measured at ~515 ms median. Django proxies
several calls per user action, so that cost was paid repeatedly.

Preferred path is offline signature verification using SUPABASE_JWT_SECRET
(Supabase dashboard -> Settings -> API -> JWT Secret). Without it we fall
back to remote verification behind a short TTL cache.
"""

import os
import threading
import time

import jwt


JWT_AUDIENCE = "authenticated"

CACHE_TTL_SECONDS = 300

CACHE_MAX_ENTRIES = 1024


_cache = {}
_cache_lock = threading.Lock()


class TokenError(Exception):
    """Raised when a token cannot be verified."""


def verify_locally(token: str):
    """
    Verify the token offline.

    Returns {"user_id", "email"} or None when no secret is configured.
    """

    secret = os.getenv("SUPABASE_JWT_SECRET")

    if not secret:
        return None

    try:
        claims = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
        )
    except jwt.ExpiredSignatureError as error:
        raise TokenError("Token has expired") from error
    except jwt.InvalidTokenError as error:
        raise TokenError("Invalid authentication token") from error

    uid = claims.get("sub")

    if not uid:
        raise TokenError("Token is missing a subject claim")

    return {"user_id": uid, "email": claims.get("email") or ""}


def cache_get(token: str):
    now = time.time()

    with _cache_lock:
        entry = _cache.get(token)

        if not entry:
            return None

        expires_at, value = entry

        if expires_at < now:
            _cache.pop(token, None)
            return None

        return value


def cache_put(token: str, value: dict, token_exp=None):
    expires_at = time.time() + CACHE_TTL_SECONDS

    if token_exp:
        expires_at = min(expires_at, token_exp)

    with _cache_lock:
        if len(_cache) >= CACHE_MAX_ENTRIES:
            _cache.clear()

        _cache[token] = (expires_at, value)


def token_expiry(token: str):
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        return claims.get("exp")
    except Exception:
        return None
