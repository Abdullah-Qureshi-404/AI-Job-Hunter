"""
Services for saving jobs into the database.
"""

from jobs.models import Job
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("services")


# This function saves jobs while skipping duplicates.
def save_jobs_to_db(jobs):

    total = len(jobs)
    print(f"💾 Saving {total} jobs to database...")
    
    new_jobs = 0
    skipped = 0
    failed = 0

    logger.info(f"save_jobs_to_db started. Processing {total} jobs.")

    for i, job_data in enumerate(jobs, 1):

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
            failed += 1
            logger.warning(f"Failed to save job {job_data.get('source_id')} from {job_data.get('source')}: {e}")

        if i % 100 == 0:
            print(f"Processed {i}/{total} jobs...")

    logger.info(f"save_jobs_to_db completed. Total: {total} | New: {new_jobs} | Skipped: {skipped} | Failed: {failed}")
    
    print(
        f"✅ Save complete: {new_jobs} new, {skipped} skipped, {failed} failed"
    )

    return {
        "total": total,
        "new": new_jobs,
        "skipped": skipped,
        "failed": failed,
    }


def cleanup_old_jobs(days=60):
    """
    Deletes un-bookmarked jobs older than `days` (default 60).
    Evaluated against `date_posted` first; if null, falls back to `date_fetched`.
    """
    from datetime import timedelta
    from django.utils import timezone
    from django.db.models import Q, Exists, OuterRef
    from jobs.models import SavedJob

    now = timezone.now()
    cutoff_date = now.date() - timedelta(days=days)
    cutoff_datetime = now - timedelta(days=days)

    logger.info(f"🧹 Starting cleanup of un-bookmarked jobs older than {days} days (Cutoff: {cutoff_date}).")

    saved_subquery = SavedJob.objects.filter(job=OuterRef("pk"))

    old_jobs = Job.objects.annotate(
        is_saved=Exists(saved_subquery)
    ).filter(
        is_saved=False
    ).filter(
        Q(date_posted__lt=cutoff_date) |
        Q(date_posted__isnull=True, date_fetched__lt=cutoff_datetime)
    )

    deleted_count, _ = old_jobs.delete()

    logger.info(f"✅ Retention cleanup finished: Deleted {deleted_count} jobs older than {days} days.")
    print(f"[OK] Retention cleanup finished: Deleted {deleted_count} jobs older than {days} days.")

    return {
        "days": days,
        "deleted_count": deleted_count,
        "cutoff_date": str(cutoff_date),
    }
