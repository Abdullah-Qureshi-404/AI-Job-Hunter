"""
=========================================================
ApplyAI - Per-user rate limiting
=========================================================

Every AI endpoint costs real money: /generate/resume alone is two Groq
completions plus a Voyage embedding plus a Pinecone query. Without a limit,
any authenticated user - or a stuck retry loop in the UI - can run those in a
tight loop and bill the account without bound.

Implemented as a FastAPI dependency using an in-process sliding window. That
is sufficient for a single-worker deployment. Running multiple workers would
need a shared store (Redis), and each worker would enforce its own limit.
"""

import threading
import time

from fastapi import Depends, HTTPException, Request

from middleware.auth_guard import get_current_user


_buckets = {}
_lock = threading.Lock()

# Stop the dict growing without bound on a long-running process.
MAX_TRACKED_KEYS = 5000


def _prune(now):
    stale = [key for key, hits in _buckets.items() if not hits or hits[-1] < now - 3600]

    for key in stale:
        _buckets.pop(key, None)


def rate_limit(limit: int, window_seconds: int, name: str):
    """
    Build a dependency allowing `limit` calls per `window_seconds` per user.

    Usage:
        @router.post("/resume", dependencies=[Depends(rate_limit(10, 3600, "resume"))])
    """

    def dependency(
        request: Request,
        current_user: dict = Depends(get_current_user),
    ):
        user_id = current_user.get("user_id", "anonymous")
        key = f"{name}:{user_id}"

        now = time.monotonic()
        cutoff = now - window_seconds

        with _lock:
            if len(_buckets) > MAX_TRACKED_KEYS:
                _prune(now)

            hits = [hit for hit in _buckets.get(key, []) if hit > cutoff]

            if len(hits) >= limit:
                retry_after = int(hits[0] - cutoff) + 1
                _buckets[key] = hits
                raise HTTPException(
                    status_code=429,
                    detail=(
                        f"Rate limit reached for this feature "
                        f"({limit} per {window_seconds // 60} minutes). "
                        f"Try again in {retry_after}s."
                    ),
                    headers={"Retry-After": str(retry_after)},
                )

            hits.append(now)
            _buckets[key] = hits

        return current_user

    return dependency
