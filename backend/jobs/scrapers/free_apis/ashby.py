"""
Fetch remote jobs from Ashby API.
"""

from jobs.scrapers.base import normalize_job
from jobs.scrapers.utils import fetch_json


ASHBY_COMPANIES = [
    "railway",
    "resend",
]


# This function fetches remote jobs from Ashby boards.
def fetch_ashby():

    jobs = []

    for company in ASHBY_COMPANIES:

        url = (
            "https://api.ashbyhq.com/"
            f"posting-api/job-board/{company}"
        )

        data = fetch_json(url)

        if not data:

            continue

        job_list = data.get(
            "jobs",
            []
        )

        for item in job_list:

            if not item.get(
                "isRemote",
                False
            ):

                continue

            address = item.get(
                "address",
                {}
            )

            postal = address.get(
                "postalAddress",
                {}
            )

            mapped_job = {

                "title": item.get(
                    "title"
                ),

                "company": company,

                "location": item.get(
                    "location",
                    "Remote"
                ),

                "country": postal.get(
                    "addressCountry",
                    ""
                ),

                "job_type": "remote",

                "description": item.get(
                    "descriptionHtml",
                    ""
                ),

                "requirements": "",

                "salary_min": None,

                "salary_max": None,

                "currency": "",

                "source": "ashby",

                "source_url": item.get(
                    "jobUrl"
                ),

                "source_id": item.get(
                    "id"
                ),

                "is_remote": True,

                "date_posted": item.get(
                    "publishedAt"
                ),

            }

            job = normalize_job(mapped_job)

            if job:

                jobs.append(job)

    return jobs