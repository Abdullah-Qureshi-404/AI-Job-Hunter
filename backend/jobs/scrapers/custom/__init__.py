from .rozee import fetch_rozee_jobs



# Run all custom scrapers.
def fetch_all_custom_jobs():

    all_jobs = []


    rozee_jobs = fetch_rozee_jobs()


    all_jobs.extend(
        rozee_jobs
    )


    stats = {

        "rozee": len(rozee_jobs),

        "total": len(all_jobs)

    }


    return all_jobs, stats