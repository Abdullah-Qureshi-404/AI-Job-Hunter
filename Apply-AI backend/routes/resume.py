"""
=========================================================
ApplyAI Resume Routes
=========================================================

This file only handles HTTP requests.

Business logic is written inside:
services/resume_service.py

Responsibilities:
- Upload resume
- Get user resumes
- Delete resume
"""

from typing import List

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    Query,
    status,
)

from middleware.auth_guard import get_current_user

from services.resume_service import (
    upload_resume,
    get_user_resumes,
    delete_resume,
)

from models.resume_models import (
    ResumeResponse,
    ResumeItem,
    DeleteResumeResponse,
)

router = APIRouter()


@router.post(
    "/upload",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload(
    file: UploadFile = File(...),
    resume_type: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a resume PDF.
    """

    return upload_resume(
        user_id=current_user["user_id"],
        file=file,
        resume_type=resume_type,
    )


@router.get(
    "/",
    response_model=List[ResumeItem],
)
def get_resumes(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    Return a page of the authenticated user's resumes, newest first.
    """

    return get_user_resumes(
        user_id=current_user["user_id"],
        limit=limit,
        offset=offset,
    )


@router.delete(
    "/{resume_id}",
    response_model=DeleteResumeResponse,
)
def delete(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a user's resume.
    """

    return delete_resume(
        user_id=current_user["user_id"],
        resume_id=resume_id,
    )