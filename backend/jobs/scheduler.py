import logging
import threading
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("scheduler")

_scheduler = None
_scrape_lock = threading.Lock()
is_scraping_in_progress = False


def run_scheduled_scrape():
    """
    Executes all scrapers and saves the results into the database.
    Guarded by a thread lock to prevent concurrent overlapping executions.
    """
    global is_scraping_in_progress

    # Attempt to acquire non-blocking lock. If already acquired, skip.
    if not _scrape_lock.acquire(blocking=False):
        logger.warning(
            "⚠️ [APScheduler] Scraper execution skipped: Another scraper run is currently in progress."
        )
        return

    try:
        is_scraping_in_progress = True
        logger.info("⏰ [APScheduler] Starting scheduled job scraping (5x daily trigger)...")

        from jobs.scrapers.orchestrator import run_all_scrapers
        from jobs.services import save_jobs_to_db

        result = run_all_scrapers()
        db_res = save_jobs_to_db(result["jobs"])

        logger.info(
            "✅ [APScheduler] Scheduled job scrape completed! "
            f"Fetched: {result.get('total_fetched', 0)} | "
            f"New: {db_res.get('new', 0)} | "
            f"Skipped: {db_res.get('skipped', 0)}"
        )
    except Exception as e:
        logger.exception(f"❌ [APScheduler] Error during scheduled scraper execution: {e}")
    finally:
        is_scraping_in_progress = False
        _scrape_lock.release()


def run_scheduled_cleanup():
    """
    Runs daily retention cleanup for un-bookmarked jobs older than 60 days.
    """
    try:
        logger.info("⏰ [APScheduler] Starting daily retention cleanup task...")
        from jobs.services import cleanup_old_jobs
        res = cleanup_old_jobs(days=60)
        logger.info(f"✅ [APScheduler] Daily retention cleanup finished! Deleted {res['deleted_count']} jobs.")
    except Exception as e:
        logger.exception(f"❌ [APScheduler] Error during daily retention cleanup: {e}")


def start_scheduler():
    """
    Starts the APScheduler background thread to:
    1. Run job scrapers 5 times a day (12 AM, 12 PM, 3 PM, 6 PM, 9 PM).
    2. Run daily job retention cleanup at 2:00 AM.
    """
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        logger.info("APScheduler is already running.")
        return

    _scheduler = BackgroundScheduler()

    # 1. Scraper Schedule: 12 AM (0), 12 PM (12), 3 PM (15), 6 PM (18), 9 PM (21)
    scrape_trigger = CronTrigger(hour="0,12,15,18,21", minute=0)

    _scheduler.add_job(
        run_scheduled_scrape,
        trigger=scrape_trigger,
        id="scrape_jobs_5x_daily",
        name="Scrape Jobs 5x Daily (12PM, 3PM, 6PM, 9PM, 12AM)",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    # 2. Retention Cleanup Schedule: 2:00 AM daily
    cleanup_trigger = CronTrigger(hour=2, minute=0)

    _scheduler.add_job(
        run_scheduled_cleanup,
        trigger=cleanup_trigger,
        id="cleanup_old_jobs_daily",
        name="Cleanup Jobs Older Than 60 Days Daily (2 AM)",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("🚀 [APScheduler] Background scheduler started! Scrapes 5x daily; Cleans 60-day old jobs at 2 AM.")

