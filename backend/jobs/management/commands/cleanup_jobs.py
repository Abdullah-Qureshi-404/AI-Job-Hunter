from django.core.management.base import BaseCommand
from jobs.services import cleanup_old_jobs
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("cleanup_jobs")


class Command(BaseCommand):
    help = "Delete un-bookmarked jobs older than N days (default 60 days)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=60,
            help="Number of days threshold for job deletion (default: 60).",
        )

    def handle(self, *args, **options):
        days = options["days"]
        self.stdout.write(f"Starting job retention cleanup for jobs older than {days} days...\n")
        try:
            res = cleanup_old_jobs(days=days)
            self.stdout.write(
                f"\n--- Retention Cleanup Report ---\n"
                f"  Cutoff Date   : {res['cutoff_date']}\n"
                f"  Deleted Jobs  : {res['deleted_count']}\n"
            )
            self.stdout.write("Done.")
        except Exception as e:
            logger.exception("Cleanup jobs command failed: %s", e)
            self.stderr.write(f"Command failed: {e}")
