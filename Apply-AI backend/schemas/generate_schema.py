"""
=========================================================
ApplyAI Generate Schemas
=========================================================

Response contract for POST /generate/resume.

These field names are authoritative and match what rag/composer.py asks the
model to produce. They previously existed only as prose in
API_DOCUMENTATION.md, which had drifted to a completely different set of
names - every consumer had to guess.
"""

from typing import Any

from pydantic import BaseModel, model_validator

from schemas.job_schema import JobAnalysisResponse


def _drop_nulls(data: Any) -> Any:
    if isinstance(data, dict):
        return {key: value for key, value in data.items() if value is not None}
    return data


class ResumeExperience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    bullets: list[str] = []

    @model_validator(mode="before")
    @classmethod
    def drop_nulls(cls, data: Any) -> Any:
        return _drop_nulls(data)


class ResumeProject(BaseModel):
    name: str = ""
    description: str = ""
    tech_stack: list[str] = []

    @model_validator(mode="before")
    @classmethod
    def drop_nulls(cls, data: Any) -> Any:
        return _drop_nulls(data)


class ResumeEducation(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""

    @model_validator(mode="before")
    @classmethod
    def drop_nulls(cls, data: Any) -> Any:
        return _drop_nulls(data)


class ResumeContent(BaseModel):
    summary: str = ""
    skills: list[str] = []
    experience: list[ResumeExperience] = []
    projects: list[ResumeProject] = []
    education: ResumeEducation = ResumeEducation()

    @model_validator(mode="before")
    @classmethod
    def drop_nulls(cls, data: Any) -> Any:
        return _drop_nulls(data)


class ResumeGenerationResponse(BaseModel):
    job_analysis: JobAnalysisResponse
    resume_content: ResumeContent
