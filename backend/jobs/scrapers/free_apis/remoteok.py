"""
Fetch jobs from RemoteOK API.
"""

from jobs.scrapers.base import normalize_job
from jobs.scrapers.utils import fetch_json
from jobs.scrapers.utils import extract_country
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("remoteok")

REMOTEOK_URL = "https://remoteok.com/api"


# This function fetches jobs from RemoteOK.
def fetch_remoteok():

    try:
        jobs = []

        data = fetch_json(REMOTEOK_URL)

        if not data:

            return jobs

        for item in data:

            if not isinstance(item, dict):
                continue

            if not item.get("position"):
                continue

            mapped_job = {

                "title": item.get("position"),

                "company": item.get("company"),

                "location": item.get("location", "Remote"),

                "country": extract_country(
                    item.get("location", "")
                ),

                "job_type": "remote",

                "description": item.get("description", ""),

                "requirements": "",

                "salary_min": item.get("salary_min"),

                "salary_max": item.get("salary_max"),

                "currency": "USD",

                "source": "remoteok",

                "source_url": item.get("url"),

                "source_id": item.get("id"),

                "is_remote": True,

                "date_posted": item.get("date"),

            }

            job = normalize_job(mapped_job)

            if job:

                jobs.append(job)

        return jobs

    except Exception as e:
        print(f"❌ remoteok failed: {e}")
        logger.exception("remoteok scraper failed")
        return []