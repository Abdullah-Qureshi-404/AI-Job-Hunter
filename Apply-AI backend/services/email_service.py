"""
=========================================================
ApplyAI Email Generation Service
=========================================================

Generates personalized outreach email using RAG resume context and Groq LLM.
"""

import logging
import re

from fastapi import HTTPException

from core.groq_client import groq_client, GROQ_MODEL
from core.json_utils import clean_json_response
from rag.retriever import search_chunks



logger = logging.getLogger(__name__)

def generate_outreach_email(
    user_id: str,
    job_title: str,
    company_name: str,
    job_description: str,
):
    """
    Generate personalized outreach application email based on user's resume chunks.
    """
    try:
        # Retrieve relevant resume chunks using existing RAG retriever
        chunks = search_chunks(
            job_description=job_description,
            user_id=user_id
        )

        if not chunks:
            raise HTTPException(
                status_code=404,
                detail="No resumes uploaded yet. Please upload a resume first."
            )

        resume_context = "\n\n".join([chunk["chunk_text"] for chunk in chunks])

        prompt = f"""
Write a job application email that a real person would send. It must be
ready to paste into an email client and send with no editing.

Job Title: {job_title}
Company: {company_name}

Job Description:
{job_description}

Candidate's resume extracts:
{resume_context}

STRUCTURE - the body must use these separate paragraphs, each divided by a
blank line (\\n\\n):

1. Greeting on its own line: "Dear Hiring Manager," (use the real name only
   if the job description states it).
2. Opening: which role you are applying for and one sentence on why this
   company specifically. Two sentences maximum.
3. Evidence: two or three sentences on the most relevant experience for THIS
   role, with concrete specifics from the resume extracts.
4. Closing: a brief, low-pressure line about next steps.
5. Sign-off on its own line: "Best regards," then the candidate's name on the
   next line, then contact details each on their own line.

HOW IT SHOULD READ:
- Plain, direct, human. Short sentences. Vary sentence length.
- Write the way a competent engineer writes to another person - not the way
  a chatbot writes a cover letter.
- BANNED words and phrases, they read as machine-written: "I am excited to",
  "I am thrilled", "passionate about", "delve", "leverage", "spearheaded",
  "cutting-edge", "innovative approach", "I am confident in my ability to",
  "strong foundation in", "make me a suitable candidate", "I am particularly
  drawn to", "seamlessly", "robust", "wealth of experience", "align with".
- Do not stack three adjectives together. Do not praise the company more than
  one short clause.
- No em dashes. No bullet points in the body.
- Total length: 120-170 words, excluding greeting and sign-off.

FACTS:
- Use ONLY facts present in the resume extracts. Do not invent skills,
  employers, metrics, or dates.
- If the candidate's name or contact details are not in the extracts, use
  [Your Name] / [Your Email] / [Your Phone] as placeholders.

OUTPUT:
Return ONLY a JSON object with keys "subject" and "body".
The "body" value must contain real \\n line breaks between paragraphs.
No markdown, no triple backticks.

{{
  "subject": "Application for {job_title}",
  "body": "Dear Hiring Manager,\\n\\n...\\n\\nBest regards,\\nName\\nEmail\\nPhone"
}}
"""

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write plain, human-sounding job application "
                        "emails. You never use corporate filler or AI cliches. "
                        "Return only a valid JSON object with 'subject' and "
                        "'body' keys."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            # A little warmth stops the output reading like a template, while
            # staying grounded in the retrieved resume facts.
            temperature=0.5,
            response_format={"type": "json_object"},
        )

        parsed = clean_json_response(response.choices[0].message.content or "")

        body = parsed.get("body", "")

        # Models frequently emit the two-character sequence \n instead of a
        # real newline, which is what collapsed the email into one block.
        if "\\n" in body:
            body = body.replace("\\r\\n", "\n").replace("\\n", "\n")

        # Normalise spacing so paragraphs are separated by exactly one blank
        # line, and the sign-off block stays tight.
        body = re.sub(r"\n{3,}", "\n\n", body).strip()

        return {
            "subject": parsed.get("subject", f"Application for {job_title} at {company_name}"),
            "body": body
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Email generation failed."
        ) from error
