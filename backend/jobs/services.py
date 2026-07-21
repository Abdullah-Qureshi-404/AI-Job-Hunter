"""
Services for saving jobs into the database.
"""

from jobs.models import Job


# This function saves jobs while skipping duplicates.
def save_jobs_to_db(jobs_list):

    total = len(jobs_list)

    new_jobs = 0

    skipped = 0

    for job_data in jobs_list:

        try:

            _, created = Job.objects.get_or_create(

                source=job_data["source"],

                source_id=job_data["source_id"],

                defaults=job_data,

            )

            if created:
                new_jobs += 1
            else:
                skipped += 1


        except Exception as e:

            print("\n==============================")
            print("FAILED JOB DATA:")
            print("==============================")

            for key, value in job_data.items():
                print(f"{key}: {value}")

            print("==============================")
            print("DATABASE ERROR:")
            print(e)
            print("==============================\n")

            raise


    return {

        "total": total,

        "new": new_jobs,

        "skipped": skipped,

    }