"""
Fetch remote jobs from Greenhouse API.
"""

from jobs.scrapers.base import normalize_job
from jobs.scrapers.utils import fetch_json
from jobs.scrapers.utils import extract_country
from jobs.scrapers.utils import contains_remote
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("greenhouse")


GREENHOUSE_COMPANIES = [
    "stripe",
    "airbnb",
    "figma",
    "vercel",
    "anthropic",
]


# This function fetches remote jobs from Greenhouse boards.
def fetch_greenhouse():

    try:
        jobs = []

        for company in GREENHOUSE_COMPANIES:

            url = (
                f"https://boards-api.greenhouse.io/v1/"
                f"boards/{company}/jobs"
            )

            data = fetch_json(url)

            if not data:
                continue

            job_list = data.get("jobs", [])

            for item in job_list:

                location = item.get(
                    "location",
                    {}
                ).get(
                    "name",
                    ""
                )

                title = item.get("title", "")

                remote_text = (
                    f"{title} {location}"
                )

                if not contains_remote(remote_text):

                    continue

                mapped_job = {

                    "title": title,

                    "company": item.get(
                        "company_name",
                        company
                    ),

                    "location": location,

                    "country": extract_country(
                        location
                    ),

                    "job_type": "remote",

                    "description": "",

                    "requirements": "",

                    "salary_min": None,

                    "salary_max": None,

                    "currency": "",

                    "source": "greenhouse",

                    "source_url": item.get(
                        "absolute_url"
                    ),

                    "source_id": item.get(
                        "id"
                    ),

                    "is_remote": True,

                    "date_posted": item.get(
                        "first_published"
                    ),

                }

                job = normalize_job(mapped_job)

                if job:

                    jobs.append(job)

        return jobs

    except Exception as e:
        print(f"❌ greenhouse failed: {e}")
        logger.exception("greenhouse scraper failed")
        return []