from django.core.management.base import BaseCommand
from jobs.scrapers.custom.ycombinator import fetch_ycombinator
from jobs.scrapers.custom.mustakbil import fetch_mustakbil
from jobs.services import save_jobs_to_db


class Command(BaseCommand):

    help = "Fetch custom scraper jobs"


    def handle(self, *args, **kwargs):

        self.stdout.write(
            "Fetching custom jobs...\n"
        )


        jobs = []


        mustakbil_jobs = fetch_mustakbil()

        jobs.extend(
            mustakbil_jobs
        )

        # Y Combinator
        ycombinator_jobs = fetch_ycombinator()
        jobs.extend(ycombinator_jobs)



        self.stdout.write(
            f"Total jobs fetched: {len(jobs)}"
        )

        result = save_jobs_to_db(
            jobs
        )


        self.stdout.write(
            str(result)
        )


        self.stdout.write(
            "\nDone."
        )