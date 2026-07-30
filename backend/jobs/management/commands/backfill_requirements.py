"""
Populate `requirements` on jobs scraped before extraction existed.

Every scraper hardcoded requirements="" because the upstream APIs return a
single combined description. Normalisation now derives the section at scrape
time; this backfills rows already in the database.

    python manage.py backfill_requirements
    python manage.py backfill_requirements --dry-run
"""

from django.core.management.base import BaseCommand

from jobs.models import Job
from jobs.scrapers.utils import extract_requirements


class Command(BaseCommand):

    help = "Derive requirements from description for existing jobs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        candidates = Job.objects.exclude(description="").filter(requirements="")

        total = candidates.count()
        self.stdout.write(f"Scanning {total} jobs with an empty requirements field...")

        updated = []

        for job in candidates.iterator(chunk_size=500):
            extracted = extract_requirements(job.description)

            if not extracted:
                continue

            job.requirements = extracted
            updated.append(job)

        if dry_run:
            self.stdout.write(
                f"Would update {len(updated)} of {total} jobs. No changes written."
            )
            return

        if updated:
            Job.objects.bulk_update(updated, ["requirements"], batch_size=500)

        self.stdout.write(
            self.style.SUCCESS(
                f"Updated {len(updated)} of {total} jobs. "
                f"{total - len(updated)} had no recognisable requirements section."
            )
        )
