"""
ApplyAI Resume Models

Pydantic models used by the Resume module.

These models define the API request and response
formats. They contain no business logic.
"""

from pydantic import BaseModel
from datetime import datetime


class ResumeResponse(BaseModel):
    """
    Returned after uploading a resume.
    """

    resume_id: str
    file_name: str
    resume_type: str
    # "processing" while background embedding runs, "uploaded_and_embedded"
    # when the synchronous path was used.
    status: str
    is_embedded: bool = False
    # Structure detected from the uploaded PDF: section order, column count,
    # typeface family, plus an ATS warning for two-column designs.
    layout: dict | None = None


class ResumeItem(BaseModel):
    """
    Single resume information.
    """

    resume_id: str
    file_name: str
    resume_type: str
    uploaded_at: datetime
    is_embedded: bool


class DeleteResumeResponse(BaseModel):
    """
    Returned after deleting a resume.
    """

    message: str