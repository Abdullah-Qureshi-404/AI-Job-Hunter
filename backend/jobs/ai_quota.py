"""
Per-user daily AI usage quota enforcement.

Uses Django's cache (memory by default) to count AI generation calls per
supabase_uid per UTC calendar day.  Counts are keyed so they automatically
expire at midnight UTC when the cache key changes.

Design notes:
- This is a soft rate-limit guard on paid AI API costs, *separate* from the
  DRF request throttle which controls throughput/DDoS.
- Default daily limit: 20 AI generations per user.
- Override via env-var  AI_DAILY_QUOTA  (integer).
"""

import os
from datetime import date

from django.core.cache import cache

# Default: 20 AI calls per user per day.  Set AI_DAILY_QUOTA=0 to disable.
AI_DAILY_QUOTA = int(os.getenv("AI_DAILY_QUOTA", "20"))


def _quota_cache_key(supabase_uid: str) -> str:
    today = date.today().isoformat()          # e.g. "2025-08-10"
    return f"ai_quota:{supabase_uid}:{today}"


def check_and_increment_quota(supabase_uid: str) -> tuple[bool, int]:
    """
    Check whether the user is within their daily quota and increment the
    counter if so.

    Returns:
        (allowed: bool, current_count: int)
        allowed=False means the quota has been reached; counter is NOT
        incremented so the count stays accurate.
    """
    if AI_DAILY_QUOTA <= 0:
        # Quota enforcement disabled.
        return True, 0

    key = _quota_cache_key(supabase_uid)

    # add() is atomic: sets to 1 only if the key doesn't exist yet.
    cache.add(key, 0, timeout=86400)          # 24-hour TTL as a safety net
    current = cache.incr(key)

    if current > AI_DAILY_QUOTA:
        # Roll back the increment so the count stays at the limit.
        cache.decr(key)
        return False, AI_DAILY_QUOTA

    return True, current
