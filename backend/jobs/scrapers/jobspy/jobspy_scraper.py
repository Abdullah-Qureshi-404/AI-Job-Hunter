"""
JobSpy scraper.

Uses python-jobspy to scrape jobs from:
LinkedIn, Indeed, Glassdoor, ZipRecruiter.

Returns jobs in our common Job model format.
"""

from jobspy import scrape_jobs
from ..base import normalize_job
from ..utils import safe_string, safe_int


# Search keywords for software jobs.
SEARCH_TERMS = [

    "software engineer remote",

    "python developer remote",

    "react developer remote",

    "AI engineer remote",

    "backend developer remote",

    "fullstack developer remote",

    "machine learning engineer remote",

    "data scientist remote",

]


# Fetch jobs using python-jobspy.
def fetch_from_jobspy():

    all_jobs = []

    seen_urls = set()


    for search_term in SEARCH_TERMS:

        print(
            f"Searching: {search_term}..."
        )


        try:

            jobs_df = scrape_jobs(

                site_name=[
                    "linkedin",
                    "indeed",
                ],

                search_term=search_term,

                location="Remote",

                results_wanted=25,

            )


            if jobs_df.empty:

                continue


            for _, row in jobs_df.iterrows():


                job_url = safe_string(
                    row.get("job_url")
                    )


                # Avoid duplicate jobs.
                if job_url in seen_urls:

                    continue


                seen_urls.add(
                    job_url
                )


                job_type = str(
                    row.get(
                        "job_type",
                        ""
                    )
                ).lower()


                # Remove hybrid and onsite jobs.
                if (
                    "hybrid" in job_type
                    or "on-site" in job_type
                    or "onsite" in job_type
                ):

                    continue



                # Keep only remote jobs.
                is_remote = row.get(
                    "is_remote",
                    False
                )


                if not is_remote:

                    continue



                source_name = safe_string(
                    row.get("site") ) or "jobspy"


                mapped_job = {

                    "title": safe_string(
                        row.get("title")
                    ),

                    "company": safe_string(
                        row.get("company")
                    ),

                    "location": safe_string(
                        row.get("location")
                    ) or "Remote"
                    ,

                    "country": "",


                    "job_type": safe_string(
                        row.get("job_type")
                    ) or "remote",


                    "description": safe_string(
                        row.get("description")
                    ) or "",


                    "requirements": "",


                    "salary_min": safe_int(
                        row.get("min_amount")
                    ),


                    "salary_max": safe_int(
                        row.get("max_amount")
                    ),


                    "currency": safe_string(
                        row.get("currency")
                    ) or "",


                    "source": (
                        f"jobspy_{source_name}"
                    ),


                    "source_url": job_url,


                    "source_id": str(
                        row.get(
                            "id"
                        )
                        or job_url
                    ),


                    "is_remote": True,


                    "date_posted": row.get(
                        "date_posted"
                    ),

                }



                normalized_job = normalize_job(
                    mapped_job
                )


                if normalized_job:

                    all_jobs.append(
                        normalized_job
                    )


        except Exception as error:

            print(
                f"JobSpy failed for {search_term}: {error}"
            )

            continue



    print(
        f"JobSpy total unique jobs: {len(all_jobs)}"
    )


    return all_jobs