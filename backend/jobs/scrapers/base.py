"""
Common job normalization functions.

Each scraper converts its API response into a common dictionary.
This file performs shared validation and cleanup before saving.
"""

from datetime import datetime
import math
from .utils import safe_int, safe_string


# This function checks if a job is fully remote.
def is_remote_job(job):

    title = str(job.get("title", "")).lower()

    location = str(job.get("location", "")).lower()

    remote_keywords = [
        "remote",
        "worldwide",
        "anywhere",
        "global",
    ]

    reject_keywords = [
        "hybrid",
        "on-site",
        "onsite",
        "office",
    ]

    for word in reject_keywords:

        if word in title or word in location:
            return False

    for word in remote_keywords:

        if word in title or word in location:
            return True

    return job.get("is_remote", False)


# This function converts API datetime into Django DateField format.
# Convert different date formats into YYYY-MM-DD.

def clean_date(date_value):
    """
    Convert different date formats into YYYY-MM-DD.
    """

    if date_value in [None, "", 0]:
        return None

    try:
        # Unix timestamp
        if isinstance(date_value, (int, float)):
            return datetime.fromtimestamp(date_value).date()

        # Timestamp stored as string
        if str(date_value).isdigit():
            return datetime.fromtimestamp(int(date_value)).date()

        # ISO datetime string
        return str(date_value)[:10]

    except Exception:
        return None
    

# This function converts a mapped job into our Job model format.
def normalize_job(job):

    title = safe_string(job.get("title"))
    if not title:
        return None

    company = safe_string(job.get("company")) or "Unknown"

    if not job.get("source"):
        return None

    if not job.get("source_id"):
        return None

    normalized_job = {

        "title": safe_string(job.get("title"))[:255],
        
        "company": company[:255],

        "location": (safe_string(job.get("location")) or "Remote")[:255],

        "country": (safe_string(job.get("country")) or "")[:255],

        "job_type": safe_string(job.get("job_type")) or "remote",

        "description": safe_string(job.get("description")) or "",

        "requirements": safe_string(job.get("requirements")) or "",

        "salary_min": safe_int(job.get("salary_min")),

        "salary_max": safe_int(job.get("salary_max")),

        "currency": safe_string(job.get("currency")) or "",

        "source": job.get("source"),

        "source_url": job.get("source_url", ""),

        "source_id": str(job.get("source_id"))[:255],

        "is_remote": is_remote_job(job),

        "date_posted": clean_date(job.get("date_posted")),

        "is_active": True,

    }

    return normalized_job

