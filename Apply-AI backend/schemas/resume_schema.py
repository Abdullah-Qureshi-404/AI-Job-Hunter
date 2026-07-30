"""
ApplyAI Resume Schemas

Defines API request and response structures
for resume operations.

No business logic exists here.
"""

from pydantic import BaseModel


class ResumeResponse(BaseModel):
    """
    Response after resume upload.
    """

    resume_id: str
    file_name: str
    resume_type: str
    status: str



class ResumeListItem(BaseModel):
    """
    Single resume item returned in resume list.
    """

    resume_id: str
    file_name: str
    resume_type: str
    uploaded_at: str
    is_embedded: bool