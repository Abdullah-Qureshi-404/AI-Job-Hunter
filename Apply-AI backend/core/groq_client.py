"""
ApplyAI Groq Client

Creates reusable Groq LLM client.

Used for:
- Resume generation
- Job description analysis
- Email generation
"""

from groq import Groq

from core.config import settings


def create_groq_client():
    """
    Creates and returns Groq client.
    """

    try:

        client = Groq(
            api_key=settings.GROQ_API_KEY
        )

        return client

    except Exception as error:
        raise Exception(
            f"Groq initialization failed: {error}"
        )


# Global Groq client
groq_client = create_groq_client()


# Model used throughout ApplyAI
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODEL = "qwen/qwen3.6-27b"


def call_groq_with_retry(func, max_retries=3, **kwargs):
    """
    Execute a Groq API call with selective exponential backoff retries.
    Retries ONLY on transient rate limits (429), timeouts, or 5xx server errors.
    NEVER retries 400/401/403/422 client errors.
    """
    import time
    import random
    import logging

    logger = logging.getLogger(__name__)

    for attempt in range(1, max_retries + 1):
        try:
            return func(**kwargs)
        except Exception as exc:
            status_code = getattr(exc, "status_code", None) or getattr(exc, "code", None)
            # 4xx client errors (400, 401, 403, 422) are NOT transient - do not retry
            if status_code in [400, 401, 403, 404, 422]:
                raise

            is_transient = (
                status_code in [429, 500, 502, 503, 504] or
                "rate" in str(exc).lower() or
                "timeout" in str(exc).lower() or
                "connection" in str(exc).lower() or
                "overloaded" in str(exc).lower()
            )
            if not is_transient or attempt == max_retries:
                raise

            backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
            logger.warning(
                "Transient Groq API error (attempt %d/%d), retrying in %.2fs: %s",
                attempt, max_retries, backoff, exc
            )
            time.sleep(backoff)