"""
Remotive job scraper.

Fetches remote jobs from Remotive API
and converts them into our common job format.
"""

import requests
import re

from ..base import normalize_job, clean_date
from ..utils import clean_html
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("remotive")


# Parse salary text into minimum and maximum values.
def parse_salary(salary):

    if not salary:
        return None, None

    numbers = re.findall(
        r"\d+",
        salary.replace(",", "")
    )

    if len(numbers) >= 2:
        return int(numbers[0]), int(numbers[1])

    if len(numbers) == 1:
        return int(numbers[0]), None

    return None, None


# Fetch jobs from Remotive API.
def fetch_remotive():

    categories = [
        "software-dev",
        "devops",
        "data",
        "product",
    ]

    jobs = []

    try:

        for category in categories:

            url = (
                "https://remotive.com/api/remote-jobs"
                f"?category={category}"
            )

            response = requests.get(
                url,
                timeout=15
            )

            response.raise_for_status()

            data = response.json()


            for item in data.get("jobs", []):

                salary_min, salary_max = parse_salary(
                    item.get("salary")
                )


                mapped_job = {

                    "title": item.get(
                        "title",
                        ""
                    ),

                    "company": item.get(
                        "company_name",
                        ""
                    ),

                    "location": item.get(
                        "candidate_required_location",
                        "Remote"
                    ),

                    "country": item.get(
                        "candidate_required_location",
                        ""
                    ),

                    "job_type": item.get(
                        "job_type",
                        "remote"
                    ),

                    "description": clean_html(
                        item.get(
                            "description",
                            ""
                        )
                    ),

                    "requirements": "",

                    "salary_min": salary_min,

                    "salary_max": salary_max,

                    "currency": "",

                    "source": "remotive",

                    "source_url": item.get(
                        "url",
                        ""
                    ),

                    "source_id": str(
                        item.get(
                            "id"
                        )
                    ),

                    "is_remote": True,

                    "date_posted": clean_date(
                        item.get(
                            "publication_date"
                        )
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
            f"Remotive scraper failed: {error}"
        )
        logger.exception("Scraper failed")


    return jobs