"""
ApplyAI Generate Routes

Triggers AI resume generation.

Business logic:
services/generate_service.py
"""

from fastapi import APIRouter, Depends

from middleware.auth_guard import get_current_user
from middleware.rate_limit import rate_limit

from services.generate_service import (
    generate_resume_content
)

from schemas.job_schema import (
    JobAnalyzeRequest
)

from schemas.generate_schema import (
    ResumeGenerationResponse
)


router = APIRouter()



@router.post(
    "/resume",
    response_model=ResumeGenerationResponse,
    dependencies=[Depends(rate_limit(15, 3600, "generate_resume"))],
)
def generate(
    data: JobAnalyzeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate tailored resume.
    """

    return generate_resume_content(
        user_id=current_user["user_id"],
        job_description=data.job_description
    )