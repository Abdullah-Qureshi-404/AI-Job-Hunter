"""
=========================================================
ApplyAI Email Schemas
=========================================================

Request and response contract for POST /email/generate.
"""

from pydantic import BaseModel, Field


class EmailGenerateRequest(BaseModel):
    job_title: str = Field(..., min_length=1)
    company_name: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=30)


class EmailResponse(BaseModel):
    subject: str = ""
    body: str = ""
