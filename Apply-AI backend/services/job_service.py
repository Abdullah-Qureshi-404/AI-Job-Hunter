"""
ApplyAI Job Service

Responsibilities:
- Analyze job description
- Extract structured information using Groq
- Return clean JSON
"""

import base64
import logging
import re

from fastapi import HTTPException

from core.groq_client import (
    groq_client,
    GROQ_MODEL,
    GROQ_VISION_MODEL
)

from core.json_utils import clean_json_response
from core.groq_errors import raise_friendly_groq_error


logger = logging.getLogger(__name__)



def build_job_prompt(
    job_description: str
):
    """
    Create Groq prompt.
    """

    return f"""

Analyze this job description.

Extract:

- job_title
- company
- required_skills
- preferred_skills
- experience_level
- key_responsibilities


Rules:

- Return ONLY JSON.
- No markdown.
- No explanation.
- No ```.


JSON format:

{{
 "job_title": "",
 "company": "",
 "required_skills": [],
 "preferred_skills": [],
 "experience_level": "",
 "key_responsibilities": []
}}


Job Description:

{job_description}

"""



def analyze_job_description(
    job_description: str
):
    """
    Analyze job description.
    """

    try:

        prompt = build_job_prompt(
            job_description
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
                        "Return only valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],

                temperature=0
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

        logger.exception("Job analysis failed")
        raise_friendly_groq_error(error, "analyze this job description")


def analyze_job_from_image(
    image_bytes: bytes,
    image_media_type: str
):
    """
    Extract job description text from image using Groq vision,
    then reuse analyze_job_description() to produce structured JSON.
    """
    valid_types = ["image/jpeg", "image/png", "image/webp"]
    if image_media_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Allowed formats: JPEG, PNG, WEBP"
        )

    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{image_media_type};base64,{base64_image}"

        vision_prompt = (
            "Transcribe the job posting text visible in this screenshot. "
            "Copy the text exactly as it appears - do not summarise, rewrite, "
            "or add anything that is not visible in the image.\n\n"
            "If the image contains no readable job posting, reply with "
            "exactly NO_JOB_POSTING_FOUND and nothing else.\n\n"
            "Do not use markdown formatting or commentary."
        )

        response = groq_client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt},
                        {"type": "image_url", "image_url": {"url": data_url}}
                    ]
                }
            ],
            temperature=0
        )

        extracted_text = response.choices[0].message.content or ""
        # Clean reasoning tags if any
        extracted_text = re.sub(r"<think>.*?</think>", "", extracted_text, flags=re.DOTALL).strip()

        # Without this the model will happily invent a plausible job posting
        # from an image that contains none.
        if "NO_JOB_POSTING_FOUND" in extracted_text or len(extracted_text) < 40:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No job posting text could be read from that image. "
                    "Try a clearer screenshot, or paste the text instead."
                )
            )

        # Reuse existing job description analysis logic
        return analyze_job_description(extracted_text)

    except HTTPException:
        raise
    except Exception as error:
        # Log the real cause. A generic message here previously hid a
        # NameError for several debugging sessions.
        logger.exception("Image job analysis failed")
        raise_friendly_groq_error(error, "read the job posting from that image")
