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
from rag.embedder import download_pdf, extract_text


logger = logging.getLogger(__name__)

# Roughly 30k characters keeps the prompt inside the model's context window
# even for users with many resumes. Previously every resume was concatenated
# in full, so this endpoint started returning 500s as resume count grew.
MAX_PROMPT_CHARS = 30_000


def get_user_profile(user_id: str):
    """
    Generate skills and experience profile from user's uploaded resumes.
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

        return {
            "user_id": user_id,
            "skills": parsed.get("skills", []),
            "experience": parsed.get("experience", [])
        }

    except Exception as error:
        logger.exception("Failed to generate profile for %s", user_id)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate profile."
        ) from error
