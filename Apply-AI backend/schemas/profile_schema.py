"""
=========================================================
ApplyAI Profile Schemas
=========================================================

Response contract for GET /profile/.
"""

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    user_id: str
    skills: list[str] = []
    experience: list[str] = []
