"""
Run all job scrapers.
"""

from jobs.scrapers.free_apis.remoteok import fetch_remoteok
from jobs.scrapers.free_apis.arbeitnow import fetch_arbeitnow
from jobs.scrapers.free_apis.greenhouse import fetch_greenhouse
from jobs.scrapers.free_apis.ashby import fetch_ashby
from jobs.scrapers.free_apis.himalayas import fetch_himalayas
from jobs.scrapers.free_apis.remotive import fetch_remotive
from jobs.scrapers.free_apis.weworkremotely import fetch_weworkremotely
from jobs.scrapers.free_apis.lever import fetch_lever
from jobs.scrapers.jobspy.jobspy_scraper import fetch_from_jobspy
from jobs.scrapers.free_apis.jobicy import fetch_jobicy


# Run all scrapers and combine jobs.
def fetch_all_free_api_jobs():

    all_jobs = []


    stats = {

        "remoteok": 0,

        "arbeitnow": 0,

        "greenhouse": 0,

        "ashby": 0,

        "himalayas": 0,

        "remotive": 0,

        "weworkremotely": 0,

        "jobspy": 0,

        "lever": 0,

        "jobicy": 0,

        "total": 0,

    }



    scrapers = [

        ("remoteok", fetch_remoteok),

        ("arbeitnow", fetch_arbeitnow),

        ("greenhouse", fetch_greenhouse),

        ("ashby", fetch_ashby),

        ("himalayas", fetch_himalayas),

        ("remotive", fetch_remotive),

        ("weworkremotely", fetch_weworkremotely),

        ("jobspy", fetch_from_jobspy),

        ("jobicy", fetch_jobicy),

        ("lever", fetch_lever),

    ]



    for name, scraper in scrapers:

        try:

            jobs = scraper()

            stats[name] = len(jobs)

            all_jobs.extend(jobs)

            print(
                f"{name}: {len(jobs)} jobs"
            )


        except Exception as error:

            print(
                f"{name} failed"
            )

            print(error)



    stats["total"] = len(
        all_jobs
    )


    return all_jobs, stats


def fetch_all_jobs():

    jobs = []


    jobs.extend(
        fetch_all_free_api_jobs()
    )


    jobs.extend(
        fetch_rozee_jobs()
    )


    return jobs