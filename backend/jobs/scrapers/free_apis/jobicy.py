"""
Fetch jobs from Jobicy API.

Jobicy provides free remote job listings.
No authentication required.

API:
https://jobicy.com/api/v2/remote-jobs
"""

from jobs.scrapers.base import normalize_job
from jobs.scrapers.utils import fetch_json
from jobs.scrapers.utils import contains_remote
from jobs.scrapers.utils import extract_country



JOBICY_URL = (
    "https://jobicy.com/api/v2/remote-jobs"
)



# Fetch jobs from Jobicy API.
def fetch_jobicy():

    jobs = []


    data = fetch_json(
        JOBICY_URL
    )


    if not data:

        return jobs



    job_list = data.get(
        "jobs",
        []
    )


    for item in job_list:


        mapped_job = map_jobicy_job(
            item
        )


        if not mapped_job:

            continue



        job = normalize_job(
            mapped_job
        )


        if job:

            jobs.append(
                job
            )


    return jobs





# Convert Jobicy response into common format.
def map_jobicy_job(item):

    try:

        title = item.get(
            "jobTitle",
            ""
        )


        url = item.get(
            "url",
            ""
        )


        if not title:

            return None



        location = item.get(
            "jobGeo",
            "Remote"
        )


        description = item.get(
            "jobDescription",
            ""
        )


        remote = contains_remote(
            title
            + " "
            + location
            + " "
            + description
        )



        return {

            "title": title,

            "company": item.get(
                "companyName",
                ""
            ),

            "location": location,

            "country": extract_country(
                location
            ),

            "job_type": "remote"
            if remote
            else "full-time",


            "description": description,


            "requirements": "",


            "salary_min": None,


            "salary_max": None,


            "currency": "USD",


            "source": "jobicy",


            "source_url": url,


            "source_id": str(
                item.get(
                    "id",
                    url
                )
            ),


            "is_remote": remote,


            "date_posted": item.get(
                "pubDate"
            ),

        }


    except Exception as error:


        print(
            f"Jobicy mapping failed: {error}"
        )


        return None