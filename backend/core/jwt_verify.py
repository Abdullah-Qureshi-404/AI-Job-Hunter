"""
Supabase token verification.

Why this exists
---------------
Both backends used to call ``supabase.auth.get_user(token)`` on every request.
That is a live HTTPS round-trip to the Supabase auth server, measured at a
median of ~515 ms on this machine. A page making three API calls therefore
paid ~1.5 s of pure authentication overhead before any query ran.

Two strategies, in order of preference:

1. Local signature verification (~0.1 ms, no network). Requires
   SUPABASE_JWT_SECRET, found in the Supabase dashboard under
   Settings -> API -> JWT Settings -> JWT Secret.

2. Remote verification with a short-lived in-process cache. Used when the
   secret is not configured. The first call for a token still costs a round
   trip; every later call within the TTL is free.
"""

import os
import threading
import time

import jwt


# Supabase stamps this audience on signed-in user tokens.
JWT_AUDIENCE = "authenticated"

# How long a remotely verified token stays trusted. Kept well under the
# typical 1 hour token lifetime so revocation still takes effect quickly.
CACHE_TTL_SECONDS = 300

# Guards against a pathological number of distinct tokens.
CACHE_MAX_ENTRIES = 1024


_cache = {}
_cache_lock = threading.Lock()


class TokenError(Exception):
    """Raised when a token cannot be verified."""


def _jwt_secret():
    return os.getenv("SUPABASE_JWT_SECRET")


def verify_locally(token):
    """
    Verify the token's signature offline.

    Returns (supabase_uid, email) or None when no secret is configured.
    Raises TokenError when a secret is configured but the token is bad.
    """

    secret = _jwt_secret()

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

    return uid, claims.get("email") or ""


def cache_get(token):
    """Return a cached (uid, email) pair, or None."""

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


def cache_put(token, value, token_exp=None):
    """Cache a verified (uid, email) pair."""

    expires_at = time.time() + CACHE_TTL_SECONDS

    # Never trust a token past its own expiry.
    if token_exp:
        expires_at = min(expires_at, token_exp)

    with _cache_lock:
        if len(_cache) >= CACHE_MAX_ENTRIES:
            _cache.clear()

        _cache[token] = (expires_at, value)


def token_expiry(token):
    """Read the exp claim without verifying. Returns None if unreadable."""

    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        return claims.get("exp")
    except Exception:
        return None
