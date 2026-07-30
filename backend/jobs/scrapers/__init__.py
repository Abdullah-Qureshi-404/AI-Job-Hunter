"""
Run all job scrapers.
"""

from jobs.scrapers.free_apis.remoteok import fetch_remoteok
from jobs.scrapers.free_apis.arbeitnow import fetch_arbeitnow
from jobs.scrapers.free_apis.greenhouse import fetch_greenhouse
from jobs.scrapers.free_apis.ashby import fetch_ashby
from jobs.scrapers.free_apis.himalayas import fetch_himalayas
from jobs.scrapers.free_apis.remotive import fetch_remotive
from jobs.scrapers.free_apis.weworkremotely import fetch_weworkremotely
from jobs.scrapers.free_apis.lever import fetch_lever
from jobs.scrapers.jobspy.jobspy_scraper import fetch_from_jobspy
from jobs.scrapers.free_apis.jobicy import fetch_jobicy


