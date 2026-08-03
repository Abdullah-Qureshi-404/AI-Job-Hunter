"""
=========================================================
ApplyAI Profile Routes
=========================================================

Provides intelligence profile generated from resume data.

Business logic:
services/profile_service.py
"""

from fastapi import APIRouter, Depends

from middleware.auth_guard import get_current_user
from middleware.rate_limit import rate_limit

from services.profile_service import (
    get_user_profile
)

from schemas.profile_schema import (
    ProfileResponse
)


router = APIRouter()


@router.get(
    "/",
    response_model=ProfileResponse,
    dependencies=[Depends(rate_limit(30, 3600, "profile"))],
)
def get_profile(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's skills and experience extracted from uploaded resumes.
    """

    return get_user_profile(
        user_id=current_user["user_id"]
    )
