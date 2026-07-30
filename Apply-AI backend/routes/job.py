"""
ApplyAI Job Routes

Handles job description API requests.

Business logic:
services/job_service.py
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from middleware.auth_guard import get_current_user

from schemas.job_schema import (
    JobAnalyzeRequest,
    JobAnalysisResponse
)

from services.job_service import (
    analyze_job_description,
    analyze_job_from_image
)


router = APIRouter()



@router.post(
    "/analyze",
    response_model=JobAnalysisResponse
)
def analyze_job(
    data: JobAnalyzeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze job description.
    """

    if len(data.job_description.strip()) < 30:

        raise HTTPException(
            status_code=400,
            detail="Job description must be at least 30 characters"
        )


    return analyze_job_description(
        data.job_description
    )


@router.post(
    "/analyze-image",
    response_model=JobAnalysisResponse
)
def analyze_job_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze job description from a screenshot/image upload.
    """
    allowed_types = {
        "image/jpeg": "image/jpeg",
        "image/jpg": "image/jpeg",
        "image/png": "image/png",
        "image/webp": "image/webp",
    }

    content_type = file.content_type.lower() if file.content_type else ""

    if content_type not in allowed_types and file.filename:
        ext = file.filename.lower().split(".")[-1]
        if ext in ["jpg", "jpeg"]:
            content_type = "image/jpeg"
        elif ext == "png":
            content_type = "image/png"
        elif ext == "webp":
            content_type = "image/webp"

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP image files are allowed."
        )

    image_bytes = file.file.read()

    # 5MB size limit
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size exceeds the maximum allowed limit of 5MB."
        )

    return analyze_job_from_image(
        image_bytes=image_bytes,
        image_media_type=allowed_types[content_type]
    )
