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
    status: str


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