import logging

logger = logging.getLogger("jobs")


def get_scraper_logger(name):
    return logging.getLogger(f"jobs.scrapers.{name}")
