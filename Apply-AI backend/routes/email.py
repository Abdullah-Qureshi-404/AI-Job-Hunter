"""
=========================================================
ApplyAI Email Routes
=========================================================

Handles AI email generation API requests.

Business logic:
services/email_service.py
"""

from fastapi import APIRouter, Depends

from middleware.auth_guard import get_current_user
from middleware.rate_limit import rate_limit
from services.email_service import generate_outreach_email

from schemas.email_schema import (
    EmailGenerateRequest,
    EmailResponse,
)


router = APIRouter()


@router.post(
    "/generate",
    response_model=EmailResponse,
    dependencies=[Depends(rate_limit(20, 3600, "generate_email"))],
)
def generate_email(
    data: EmailGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate personalized outreach email based on job details and resume context.
    """

    return generate_outreach_email(
        user_id=current_user["user_id"],
        job_title=data.job_title,
        company_name=data.company_name,
        job_description=data.job_description,
    )
