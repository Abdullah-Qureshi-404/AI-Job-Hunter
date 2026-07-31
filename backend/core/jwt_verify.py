"""
Supabase token verification.

Why this exists
---------------
Both backends used to call ``supabase.auth.get_user(token)`` on every request.
That is a live HTTPS round-trip to the Supabase auth server, measured at a
median of ~515 ms on this machine. A page making three API calls therefore
paid ~1.5 s of pure authentication overhead before any query ran.

Three strategies, tried in order:

1. JWKS / asymmetric verification (ES256 or RS256). The project publishes its
   public key at ``/auth/v1/.well-known/jwks.json``. We fetch it once, cache
   it, and verify signatures offline. No secret needs to be configured.

2. HS256 verification using SUPABASE_JWT_SECRET, for projects still issuing
   legacy symmetric tokens.

3. Remote verification with a short-lived cache. Last resort, so the app keeps
   working even if the first two are unavailable.
"""

import os
import threading
import time

import jwt
from jwt import PyJWKClient


# Supabase stamps this audience on signed-in user tokens.
JWT_AUDIENCE = "authenticated"

ASYMMETRIC_ALGORITHMS = ["ES256", "RS256"]

# How long a remotely verified token stays trusted. Kept well under the
# typical 1 hour token lifetime so revocation still takes effect quickly.
CACHE_TTL_SECONDS = 300

CACHE_MAX_ENTRIES = 1024


_cache = {}
_cache_lock = threading.Lock()

_jwk_client = None
_jwk_lock = threading.Lock()


class TokenError(Exception):
    """Raised when a token cannot be verified."""


def _get_jwk_client():
    """Lazily build a JWKS client. PyJWKClient caches fetched keys itself."""

    global _jwk_client

    if _jwk_client is not None:
        return _jwk_client

    supabase_url = os.getenv("SUPABASE_URL")

    if not supabase_url:
        return None

    with _jwk_lock:
        if _jwk_client is None:
            _jwk_client = PyJWKClient(
                f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json",
                cache_keys=True,
                lifespan=3600,
            )

    return _jwk_client


def _claims_to_user(claims):
    uid = claims.get("sub")

    if not uid:
        raise TokenError("Token is missing a subject claim")

    return uid, claims.get("email") or ""


def verify_locally(token):
    """
    Verify the token's signature offline.

    Returns (supabase_uid, email), or None when neither offline strategy is
    available for this token. Raises TokenError when the token is genuinely
    invalid or expired.
    """

    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as error:
        raise TokenError("Invalid authentication token") from error

    algorithm = header.get("alg")

    # --- 1. Asymmetric (no configuration required) ---
    if algorithm in ASYMMETRIC_ALGORITHMS:
        client = _get_jwk_client()

        if client is not None:
            try:
                signing_key = client.get_signing_key_from_jwt(token)
                claims = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=ASYMMETRIC_ALGORITHMS,
                    audience=JWT_AUDIENCE,
                )
                return _claims_to_user(claims)
            except jwt.ExpiredSignatureError as error:
                raise TokenError("Token has expired") from error
            except jwt.InvalidTokenError as error:
                raise TokenError("Invalid authentication token") from error
            except Exception:
                # Network/JWKS problem - fall through to the other strategies
                # rather than locking every user out.
                return None

    # --- 2. Symmetric, if a secret is configured ---
    secret = os.getenv("SUPABASE_JWT_SECRET")

    if algorithm == "HS256" and secret:
        try:
            claims = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience=JWT_AUDIENCE,
            )
            return _claims_to_user(claims)
        except jwt.ExpiredSignatureError as error:
            raise TokenError("Token has expired") from error
        except jwt.InvalidTokenError as error:
            raise TokenError("Invalid authentication token") from error

    return None


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
