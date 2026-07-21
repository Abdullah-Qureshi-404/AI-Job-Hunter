"""
Central orchestrator for all job scrapers.

Loops through SCRAPER_REGISTRY, runs each enabled scraper
independently, and collects all results into a single response.

One scraper failing never stops the others.
"""

from jobs.scrapers.registry import SCRAPER_REGISTRY
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("orchestrator")


# Extract a clean jobs list from whatever a scraper returns.
#
# Scrapers are not guaranteed to return the same format:
#   - Most return:  [job1, job2, ...]
#   - Some return:  ([job1, job2, ...], stats_dict)
#
# This function handles both cases and returns only the list.
# If the return value is neither, logs a warning and returns [].
def _extract_jobs(name, result):

    # Case 1: plain list of jobs
    if isinstance(result, list):
        return result

    # Case 2: tuple of (jobs_list, stats_dict)
    if isinstance(result, tuple) and len(result) == 2:
        jobs, _ = result
        if isinstance(jobs, list):
            return jobs

    # Case 3: unexpected return value — log and skip
    logger.warning(
        "Scraper '%s' returned unexpected type: %s",
        name,
        type(result).__name__,
    )
    return []


# Run all enabled scrapers and collect their results.
#
# Returns a dict:
#   jobs           - combined list of all normalized job dicts
#   stats          - per-scraper job count  e.g. {"remoteok": 42, ...}
#   total_fetched  - total number of jobs across all scrapers
#   failed_sources - list of scraper names that raised an exception
def run_all_scrapers():

    all_jobs = []
    stats = {}
    failed_sources = []

    for scraper in SCRAPER_REGISTRY:

        name = scraper["name"]
        fn = scraper["fn"]
        enabled = scraper["enabled"]

        # Skip disabled scrapers without logging noise.
        if not enabled:
            logger.info("Scraper '%s' is disabled — skipping.", name)
            continue

        logger.info("Running scraper: %s", name)

        try:

            result = fn()

            jobs = _extract_jobs(name, result)

            count = len(jobs)
            all_jobs.extend(jobs)
            stats[name] = count

            logger.info("Scraper '%s' fetched %d jobs.", name, count)

        except Exception as error:

            logger.error(
                "Scraper '%s' raised an exception: %s",
                name,
                error,
            )
            stats[name] = 0
            failed_sources.append(name)

    return {
        "jobs": all_jobs,
        "stats": stats,
        "total_fetched": len(all_jobs),
        "failed_sources": failed_sources,
    }
