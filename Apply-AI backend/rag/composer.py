"""
ApplyAI Resume Composer

Responsibilities:
- Take retrieved resume chunks
- Send context to Groq LLM
- Generate tailored resume JSON
- Prevent hallucination by forcing model
  to use only retrieved information
"""

import logging

from fastapi import HTTPException

from core.groq_client import (
    groq_client,
    GROQ_MODEL
)

from core.json_utils import clean_json_response




logger = logging.getLogger(__name__)


def build_resume_prompt(
    retrieved_chunks: list,
    job_description: str,
    full_resume_text: str = "",
):
    """
    Create prompt for resume generation.
    """


    if not retrieved_chunks and not full_resume_text:

        raise HTTPException(
            status_code=400,
            detail="No resume information found"
        )


    context = ""


    for index, chunk in enumerate(
        retrieved_chunks
    ):

        context += f"""

RESUME CHUNK {index + 1}

Resume Type:
{chunk.get("resume_type")}

Content:
{chunk.get("chunk_text")}

-------------------------

"""


    prompt = f"""

You are an expert resume writer.

Create a tailored resume for the job description.

IMPORTANT RULES:

1. Use ONLY information from the resume chunks.

2. NEVER invent:
- skills
- technologies
- companies
- projects
- experience
- achievements

3. If information is missing,
leave that field empty.

JOB DESCRIPTION:

{job_description}


COMPLETE RESUME TEXT (authoritative - every fact must come from here):

{full_resume_text or context}


MOST JOB-RELEVANT EXTRACTS (prioritise these, but do not limit yourself to them):

{context}


SELECTION RULES:
- Include every skill, project and role from the COMPLETE RESUME TEXT that is
  relevant to this job description. Do not silently drop sections.
- Order skills and bullet points so the ones matching the job description come
  first.
- Keep the candidate's own wording wherever possible. Rephrase only to lead
  with the job-relevant part.
- Never add a skill, employer, metric, date or project that is not in the
  COMPLETE RESUME TEXT.
- Preserve the candidate's real section order and job titles.
- Write bullets that start with a strong verb and keep any numbers the
  candidate already stated. Do not invent numbers.


Return ONLY valid JSON.

Use exactly this format:

{{
 "summary": "",

 "skills": [],

 "experience": [
    {{
      "title": "",
      "company": "",
      "duration": "",
      "bullets": []
    }}
 ],

 "projects": [
    {{
      "name": "",
      "description": "",
      "tech_stack": []
    }}
 ],

 "education": {{
      "degree": "",
      "institution": "",
      "year": ""
 }}
}}

"""


    return prompt



def generate_resume(
    retrieved_chunks: list,
    job_description: str,
    full_resume_text: str = "",
):
    """
    Generate tailored resume JSON.
    """


    try:

        prompt = build_resume_prompt(
            retrieved_chunks,
            job_description,
            full_resume_text,
        )


        response = (
            groq_client
            .chat
            .completions
            .create(

                model=GROQ_MODEL,


                messages=[

                    {
                        "role": "system",
                        "content":
                        (
                            "You generate only valid "
                            "JSON objects."
                        )
                    },

                    {
                        "role": "user",
                        "content": prompt
                    }

                ],


                response_format={
                    "type": "json_object"
                },


                temperature=0.2
            )
        )


        content = (
            response
            .choices[0]
            .message
            .content
        )


        return clean_json_response(
            content
        )


    except HTTPException:
        raise


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail="Resume generation failed."
        ) from error