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
    BackgroundTasks,
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
    get_resume_status,
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    resume_type: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a resume PDF.

    Returns as soon as the file is stored. Embedding runs in the background;
    poll GET /resumes/{resume_id}/status until is_embedded is true.
    """

    return upload_resume(
        user_id=current_user["user_id"],
        file=file,
        resume_type=resume_type,
        background_tasks=background_tasks,
    )


@router.get("/{resume_id}/status")
def resume_status(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Report whether background embedding has finished."""

    return get_resume_status(
        user_id=current_user["user_id"],
        resume_id=resume_id,
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