"""
ApplyAI Job Schemas

Defines request and response formats
for job analysis.
"""

from typing import Any

from pydantic import BaseModel, Field, model_validator


class JobAnalyzeRequest(BaseModel):
    """
    Job description input.
    """

    # Enforced here rather than per-route: /generate/resume and /email/generate
    # reach the same analysis code and previously accepted any length.
    job_description: str = Field(..., min_length=30)



class JobAnalysisResponse(BaseModel):
    """
    Structured job information.

    Every field defaults: job posts routinely omit the company name or an
    explicit seniority, and the model correctly returns null for those. With
    required fields FastAPI turned that valid output into a 500.
    """

    job_title: str = ""
    company: str = ""
    required_skills: list[str] = []
    preferred_skills: list[str] = []
    experience_level: str = ""
    key_responsibilities: list[str] = []

    @model_validator(mode="before")
    @classmethod
    def drop_nulls(cls, data: Any) -> Any:
        # An explicit `"company": null` from the model would otherwise fail
        # validation - a missing key and a null key mean the same thing here.
        if isinstance(data, dict):
            return {key: value for key, value in data.items() if value is not None}
        return data