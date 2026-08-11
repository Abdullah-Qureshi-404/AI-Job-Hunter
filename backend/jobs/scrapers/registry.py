"""
Central registry for all job scrapers.

Each entry contains:
  name    - scraper identifier (matches the source field on the Job model)
  fn      - reference to the scraper's top-level fetch function
  enabled - set to False to skip a scraper without removing it
"""

from jobs.scrapers.free_apis.remoteok import fetch_remoteok
from jobs.scrapers.free_apis.arbeitnow import fetch_arbeitnow
from jobs.scrapers.free_apis.greenhouse import fetch_greenhouse
from jobs.scrapers.free_apis.ashby import fetch_ashby
from jobs.scrapers.free_apis.himalayas import fetch_himalayas
from jobs.scrapers.free_apis.remotive import fetch_remotive
from jobs.scrapers.free_apis.weworkremotely import fetch_weworkremotely
from jobs.scrapers.free_apis.lever import fetch_lever
from jobs.scrapers.free_apis.jobicy import fetch_jobicy
from jobs.scrapers.jobspy.jobspy_scraper import fetch_from_jobspy
from jobs.scrapers.custom.mustakbil import fetch_mustakbil
from jobs.scrapers.custom.ycombinator import fetch_ycombinator
from jobs.scrapers.custom.rozee import fetch_rozee


SCRAPER_REGISTRY = [

    {
        "name": "remoteok",
        "fn": fetch_remoteok,
        "enabled": True,
    },

    {
        "name": "arbeitnow",
        "fn": fetch_arbeitnow,
        "enabled": True,
    },

    {
        "name": "greenhouse",
        "fn": fetch_greenhouse,
        "enabled": True,
    },

    {
        "name": "ashby",
        "fn": fetch_ashby,
        "enabled": True,
    },

    {
        "name": "himalayas",
        "fn": fetch_himalayas,
        "enabled": True,
    },

    {
        "name": "remotive",
        "fn": fetch_remotive,
        "enabled": True,
    },

    {
        "name": "weworkremotely",
        "fn": fetch_weworkremotely,
        "enabled": True,
    },

    {
        "name": "lever",
        "fn": fetch_lever,
        "enabled": True,
    },

    {
        "name": "jobicy",
        "fn": fetch_jobicy,
        "enabled": True,
    },

    {
        "name": "jobspy",
        "fn": fetch_from_jobspy,
        "enabled": True,
    },

    {
        "name": "mustakbil",
        "fn": fetch_mustakbil,
        "enabled": True,
    },

    {
        "name": "ycombinator",
        "fn": fetch_ycombinator,
        "enabled": True,
    },

    {
        "name": "rozee",
        "fn": fetch_rozee,
        "enabled": True,
    },

]
