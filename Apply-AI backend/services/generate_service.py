"""
ApplyAI Resume Generation Service

Connects complete AI pipeline:

Job Description
        |
        ↓
Job Analysis
        |
        ↓
Pinecone Retriever
        |
        ↓
Groq Composer
        |
        ↓
Generated Resume JSON
"""


import logging

from fastapi import HTTPException


from rag.retriever import (
    search_chunks
)


from rag.composer import (
    generate_resume
)


from services.job_service import (
    analyze_job_description
)




logger = logging.getLogger(__name__)


# A resume is only ~1-2 chunks at CHUNK_SIZE=800 words, so vector retrieval
# alone silently drops whole sections (projects, education, older roles).
# Resume generation therefore uses the FULL text of every uploaded resume,
# with retrieval used only to indicate which parts are most job-relevant.
MAX_RESUME_CHARS = 24_000


def load_full_resume_text(user_id: str) -> str:
    """Concatenate the stored text of every resume the user has uploaded."""

    from core.supabase import supabase

    try:
        response = (
            supabase.table("resumes")
            .select("file_name,extracted_text")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception:
        logger.exception("Could not load resume text for %s", user_id)
        return ""

    parts = []

    for resume in response.data or []:
        text = (resume.get("extracted_text") or "").strip()
        if text:
            parts.append(
                f"--- RESUME: {resume.get('file_name', 'resume')} ---\n{text}"
            )

    combined = "\n\n".join(parts)

    return combined[:MAX_RESUME_CHARS]

def generate_resume_content(
    user_id: str,
    job_description: str
):
    """
    Generate tailored resume content.
    """


    try:

        # Analyze job description
        job_analysis = analyze_job_description(
            job_description
        )


        # Retrieve relevant resume chunks
        chunks = search_chunks(
            job_description,
            user_id
        )


        full_resume_text = load_full_resume_text(user_id)

        if not chunks and not full_resume_text:

            raise HTTPException(
                status_code=404,
                detail=
                "No resumes uploaded yet. Please upload resumes first."
            )


        # Generate resume JSON from the complete resume text, using the
        # retrieved chunks to signal what matters most for this job.
        resume_content = generate_resume(
            chunks,
            job_description,
            full_resume_text=full_resume_text,
        )


        return {

            "job_analysis": job_analysis,

            "resume_content": resume_content

        }



    except HTTPException:

        raise



    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail="Resume generation failed."
        ) from error