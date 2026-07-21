"""
Himalayas job scraper.

Fetches remote jobs from Himalayas API
and converts them into our common job format.
"""

import requests

from ..base import normalize_job, clean_date
from ..utils import clean_html
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("himalayas")


# Fetch remote jobs from Himalayas API.
def fetch_himalayas():

    url = "https://himalayas.app/jobs/api?limit=100"

    jobs = []

    try:

        response = requests.get(
            url,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()

        for item in data.get("jobs", []):

            company = ""

            # Himalayas can return company in different formats.
            if isinstance(item.get("company"), dict):
                company = item.get("company", {}).get("name", "")

            elif item.get("companyName"):
                company = item.get("companyName", "")

            elif isinstance(item.get("company"), str):
                company = item.get("company", "")


            published_date = (
                item.get("publishedAt")
                or item.get("createdAt")
                or item.get("updatedAt")
            )


            mapped_job = {

                "title": item.get("title", ""),

                "company": company,

                "location": ", ".join(
                    item.get("locationRestrictions", [])
                ),

                "country": ", ".join(
                    item.get("locationRestrictions", [])
                ),

                "job_type": item.get(
                    "employmentType",
                    "remote"
                ),

                "description": clean_html(
                    item.get("description", "")
                ),

                "requirements": "",

                "salary_min": item.get(
                    "minSalary"
                ),

                "salary_max": item.get(
                    "maxSalary"
                ),

                "currency": item.get(
                    "currency",
                    ""
                ),

                "source": "himalayas",

                "source_url": (
                    f"https://himalayas.app/jobs/"
                    f"{item.get('slug', '')}"
                ),

                "source_id": (
                    item.get("id")
                    or item.get("slug")
                    or item.get("title")
                ),

                "is_remote": True,

                "date_posted": clean_date(
                    published_date
                ),

            }


            normalized_job = normalize_job(
                mapped_job
            )


            if normalized_job:

                jobs.append(
                    normalized_job
                )


    except Exception as error:

        print(
            f"Himalayas scraper failed: {error}"
        )
        logger.exception("Scraper failed")


    return jobs