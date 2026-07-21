from django.core.management.base import BaseCommand

from jobs.scrapers import fetch_all_free_api_jobs
from jobs.services import save_jobs_to_db


class Command(BaseCommand):

    help = "Fetch jobs from free APIs."


    # This function runs the management command.
    def handle(self, *args, **kwargs):

        self.stdout.write("Fetching free API jobs...\n")


        jobs, stats = fetch_all_free_api_jobs()


        result = save_jobs_to_db(jobs)


        self.stdout.write("\n")

        self.stdout.write(str(stats))

        self.stdout.write(str(result))

        self.stdout.write("\nDone.")