import logging
import os
import httpx

logger = logging.getLogger(__name__)

APPLY_AI_URL = os.getenv("APPLY_AI_URL", "http://localhost:8001").rstrip("/")


# def _get_auth_header(token: str) -> dict:
#     if not token:
#         return {}
#     if not token.lower().startswith("bearer "):
#         token = f"Bearer {token}"
#     return {"Authorization": token}


def _get_auth_header(token: str) -> dict:
    if not token:
        return {}
    token = str(token).strip()
    if token.lower().startswith("bearer "):
        token = token[7:]
    return {"Authorization": f"Bearer {token}"}


def generate_resume(token: str, job_description: str):
    """
    Calls ApplyAI FastAPI service to generate a tailored resume.
    Endpoint: POST /generate/resume
    """
    url = f"{APPLY_AI_URL}/generate/resume"
    headers = _get_auth_header(token)
    payload = {"job_description": job_description}

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        logger.error(f"ApplyAI generate_resume HTTP error: {exc}")
        print(f"ApplyAI generate_resume HTTP error: {exc}")
        return None
    except Exception as exc:
        logger.error(f"ApplyAI generate_resume failed: {exc}")
        print(f"ApplyAI generate_resume failed: {exc}")
        return None


def analyze_job(token: str, job_description: str):
    """
    Calls ApplyAI FastAPI service to analyze a job description.
    Endpoint: POST /job/analyze
    """
    url = f"{APPLY_AI_URL}/job/analyze"
    headers = _get_auth_header(token)
    payload = {"job_description": job_description}

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        logger.error(f"ApplyAI analyze_job HTTP error: {exc}")
        print(f"ApplyAI analyze_job HTTP error: {exc}")
        return None
    except Exception as exc:
        logger.error(f"ApplyAI analyze_job failed: {exc}")
        print(f"ApplyAI analyze_job failed: {exc}")
        return None


def get_profile(token: str):
    """
    Calls ApplyAI FastAPI service to get user intelligence profile (skills & experience).
    Endpoint: GET /profile/
    """
    url = f"{APPLY_AI_URL}/profile/"
    headers = _get_auth_header(token)

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        logger.error(f"ApplyAI get_profile HTTP error: {exc}")
        print(f"ApplyAI get_profile HTTP error: {exc}")
        return None
    except Exception as exc:
        logger.error(f"ApplyAI get_profile failed: {exc}")
        print(f"ApplyAI get_profile failed: {exc}")
        return None


def generate_email(token: str, job_title: str, company_name: str, job_description: str):
    """
    Calls ApplyAI FastAPI service to generate a personalized outreach email.
    Endpoint: POST /email/generate
    """
    url = f"{APPLY_AI_URL}/email/generate"
    headers = _get_auth_header(token)
    payload = {
        "job_title": job_title,
        "company_name": company_name,
        "job_description": job_description,
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        logger.error(f"ApplyAI generate_email HTTP error: {exc}")
        print(f"ApplyAI generate_email HTTP error: {exc}")
        return None
    except Exception as exc:
        logger.error(f"ApplyAI generate_email failed: {exc}")
        print(f"ApplyAI generate_email failed: {exc}")
        return None


def analyze_job_from_image(token: str, image_bytes: bytes, image_media_type: str):
    """
    Calls ApplyAI FastAPI service to analyze a job description screenshot image.
    Endpoint: POST /job/analyze-image
    """
    url = f"{APPLY_AI_URL}/job/analyze-image"
    headers = _get_auth_header(token)

    ext = "jpg"
    if "png" in image_media_type.lower():
        ext = "png"
    elif "webp" in image_media_type.lower():
        ext = "webp"

    files = {
        "file": (f"job_screenshot.{ext}", image_bytes, image_media_type)
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, files=files)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        logger.error(f"ApplyAI analyze_job_from_image HTTP error: {exc}")
        print(f"ApplyAI analyze_job_from_image HTTP error: {exc}")
        return None
    except Exception as exc:
        logger.error(f"ApplyAI analyze_job_from_image failed: {exc}")
        print(f"ApplyAI analyze_job_from_image failed: {exc}")
        return None



