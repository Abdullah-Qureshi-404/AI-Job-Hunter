"""
=========================================================
ApplyAI Profile Service
=========================================================

Extracts user profile intelligence (skills, experience)
from all uploaded resumes using Groq LLM.
"""

import logging

from fastapi import HTTPException

from core.supabase import supabase
from core.groq_client import groq_client, GROQ_MODEL
from core.json_utils import clean_json_response
from core.groq_errors import raise_friendly_groq_error
from rag.embedder import download_pdf, extract_text


logger = logging.getLogger(__name__)

# Roughly 30k characters keeps the prompt inside the model's context window
# even for users with many resumes. Previously every resume was concatenated
# in full, so this endpoint started returning 500s as resume count grew.
MAX_PROMPT_CHARS = 30_000


def _resume_fingerprint(resumes: list) -> str:
    """
    Identifies the exact set of resumes behind a cached profile.

    A user's skills only change when they add or remove a resume, not on
    every page load. Fingerprinting the resume id set lets the cache below
    detect "nothing changed" without re-running the LLM.
    """

    return ",".join(sorted(str(r["id"]) for r in resumes))


def _get_cached_profile(user_id: str, fingerprint: str):
    try:
        response = (
            supabase.table("profile_intelligence")
            .select("skills,experience,source_fingerprint")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception:
        # Cache table may not exist yet in some environments - degrade to
        # always recomputing rather than failing the whole request.
        logger.warning("profile_intelligence cache unavailable", exc_info=True)
        return None

    if not response.data:
        return None

    row = response.data[0]

    if row.get("source_fingerprint") != fingerprint:
        return None

    return {
        "skills": row.get("skills") or [],
        "experience": row.get("experience") or [],
    }


def _store_cached_profile(user_id: str, fingerprint: str, skills: list, experience: list):
    try:
        supabase.table("profile_intelligence").upsert(
            {
                "user_id": user_id,
                "skills": skills,
                "experience": experience,
                "source_fingerprint": fingerprint,
            }
        ).execute()
    except Exception:
        # Caching is an optimization; failing to write it must not fail the
        # request that already has a good answer to return.
        logger.warning("Could not write profile_intelligence cache", exc_info=True)


def get_user_profile(user_id: str, force_refresh: bool = False):
    """
    Generate skills and experience profile from user's uploaded resumes.

    Cached per exact resume set: this is a Groq call, and re-running it on
    every dashboard load / "Refresh matches" click burns through the daily
    token quota for no benefit, since the resumes have not changed.
    Pass force_refresh=True to bypass the cache (e.g. right after an upload).
    """

    try:

        response = (
            supabase.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        resumes = response.data or []

        if not resumes:
            return {
                "user_id": user_id,
                "skills": [],
                "experience": []
            }

        fingerprint = _resume_fingerprint(resumes)

        if not force_refresh:
            cached = _get_cached_profile(user_id, fingerprint)
            if cached is not None:
                return {
                    "user_id": user_id,
                    "skills": cached["skills"],
                    "experience": cached["experience"],
                }

        combined_texts = []

        for resume in resumes:
            text = resume.get("extracted_text")
            if not text:
                storage_path = resume.get("storage_path")
                if storage_path:
                    try:
                        pdf_bytes = download_pdf(storage_path)
                        text = extract_text(pdf_bytes)
                    except Exception:
                        logger.warning(
                            "Could not read resume %s for user %s",
                            storage_path,
                            user_id,
                        )
                        text = ""
            if text:
                combined_texts.append(text)

        full_resume_text = "\n\n--- RESUME DOCUMENT ---\n\n".join(combined_texts)

        if len(full_resume_text) > MAX_PROMPT_CHARS:
            full_resume_text = full_resume_text[:MAX_PROMPT_CHARS]
            logger.info(
                "Truncated profile prompt for user %s to %d chars",
                user_id,
                MAX_PROMPT_CHARS,
            )

        if not full_resume_text.strip():
            _store_cached_profile(user_id, fingerprint, [], [])
            return {
                "user_id": user_id,
                "skills": [],
                "experience": []
            }

        prompt = f"""
Analyze the following resume text belonging to a user.

Extract:
1. "skills": a list of professional and technical skills explicitly mentioned in the text.
2. "experience": a list of job roles, titles, or professional experience domains explicitly mentioned in the text.

Rules:
- Do NOT invent or hallucinate information. Only extract details directly stated in the resume text.
- Return ONLY a valid JSON object with keys "skills" and "experience".
- No markdown formatting or extra explanation.

Resume Text:
{full_resume_text}
"""

        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Return only valid JSON object with 'skills' and 'experience' arrays."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        parsed = clean_json_response(completion.choices[0].message.content or "")

        skills = parsed.get("skills", [])
        experience = parsed.get("experience", [])

        _store_cached_profile(user_id, fingerprint, skills, experience)

        return {
            "user_id": user_id,
            "skills": skills,
            "experience": experience,
        }

    except HTTPException:
        raise

    except Exception as error:
        logger.exception("Failed to generate profile for %s", user_id)
        raise_friendly_groq_error(error, "extract your profile from your resumes")
