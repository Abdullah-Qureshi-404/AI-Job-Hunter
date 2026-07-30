from django.core.management.base import BaseCommand

from jobs.scrapers.orchestrator import run_all_scrapers
from jobs.services import save_jobs_to_db
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("fetch_jobs")


class Command(BaseCommand):

    help = "Fetch jobs from free APIs."


    # This function runs the management command.
    def handle(self, *args, **kwargs):

        try:

            logger.info("fetch_jobs command started.")
            self.stdout.write("Fetching jobs from all scrapers...\n")


            # Step 1: Run all scrapers via the central orchestrator.
            scraper_result = run_all_scrapers()

            jobs          = scraper_result["jobs"]
            stats         = scraper_result["stats"]
            total_fetched = scraper_result["total_fetched"]
            failed        = scraper_result["failed_sources"]


            # Step 2: Save collected jobs to the database.
            db_result = save_jobs_to_db(jobs)


            # Step 3: Print formatted scraper report.
            self.stdout.write("\n--- Scraper Report ---")

            for source, count in stats.items():
                self.stdout.write(f"  {source}: {count} jobs")

            self.stdout.write(f"\n  Total fetched : {total_fetched}")

            if failed:
                self.stdout.write(f"  Failed sources: {', '.join(failed)}")
            else:
                self.stdout.write("  Failed sources: none")


            # Step 4: Print database report.
            self.stdout.write("\n--- Database Report ---")
            self.stdout.write(f"  Total processed : {db_result['total']}")
            self.stdout.write(f"  New saved       : {db_result['new']}")
            self.stdout.write(f"  Skipped (dupes) : {db_result['skipped']}")


            # Step 5: Log completion.
            logger.info(
                "fetch_jobs command completed. "
                "Fetched: %d | New: %d | Skipped: %d | Failed scrapers: %s",
                total_fetched,
                db_result["new"],
                db_result["skipped"],
                failed or "none",
            )

            self.stdout.write("\nDone.")


        except Exception as error:

            # Log the full exception with traceback for server logs.
            logger.exception("fetch_jobs command failed with an unexpected error: %s", error)

            # Print a clean message to the terminal without traceback.
            self.stderr.write(f"\nCommand failed: {error}")