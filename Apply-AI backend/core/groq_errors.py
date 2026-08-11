"""
=========================================================
Shared Groq error handling
=========================================================

Every service that calls Groq previously wrapped failures in a generic
"X failed." 500, which made a recoverable, self-explanatory problem (daily
token quota reached) indistinguishable from a real bug. This surfaces quota
and rate-limit errors as a 503 with a message the user can act on, and lets
everything else fall through to a genuine 500.
"""

from fastapi import HTTPException


def raise_friendly_groq_error(error: Exception, action: str) -> None:
    """
    Convert a Groq exception into an appropriate HTTPException and raise it.

    `action` is a short description of what the user was trying to do
    (e.g. "analyze this job", "generate your resume") for the message.
    """

    message = str(error).lower()

    if "rate_limit" in message or "429" in message:
        if "per day" in message or "tpd" in message:
            detail = (
                f"The AI provider's daily usage limit was reached, so we "
                f"could not {action} right now. This resets on a rolling "
                f"basis - please try again in a little while."
            )
        else:
            detail = (
                f"The AI provider is temporarily rate-limiting requests, so "
                f"we could not {action} right now. Please try again in a "
                f"minute."
            )

        raise HTTPException(status_code=503, detail=detail) from error

    raise HTTPException(
        status_code=503,
        detail=f"AI service is temporarily unavailable. Could not {action} right now. Please try again.",
    ) from error
