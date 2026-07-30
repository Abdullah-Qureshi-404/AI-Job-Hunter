"""
Fetch jobs from ArbeitNow API.
"""

from jobs.scrapers.base import normalize_job
from jobs.scrapers.utils import fetch_json
from jobs.scrapers.utils import extract_country
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("arbeitnow")


ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"


# This function fetches jobs from ArbeitNow.
def fetch_arbeitnow():

    try:
        jobs = []

        data = fetch_json(ARBEITNOW_URL)

        if not data:

            return jobs

        job_list = data.get("data", [])

        for item in job_list:

            if not item.get("remote"):
                continue

            mapped_job = {

                "title": item.get("title"),

                "company": item.get("company_name"),

                "location": item.get("location", "Remote"),

                "country": extract_country(
                    item.get("location", "")
                ),

                "job_type": "remote",

                "description": item.get("description", ""),

                "requirements": "",

                "salary_min": None,

                "salary_max": None,

                "currency": "",

                "source": "arbeitnow",

                "source_url": item.get("url"),

                "source_id": item.get("slug"),

                "is_remote": True,

                "date_posted": item.get("created_at"),

            }

            job = normalize_job(mapped_job)

            if job:

                jobs.append(job)

        return jobs

    except Exception as e:
        print(f"❌ arbeitnow failed: {e}")
        logger.exception("arbeitnow scraper failed")
        return []