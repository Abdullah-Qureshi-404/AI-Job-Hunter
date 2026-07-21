"""
We Work Remotely job scraper.

Fetches remote jobs from WWR RSS feed
and converts them into our common job format.
"""

import requests
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

from ..base import normalize_job
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("weworkremotely")


# Convert RSS date into Django DateField format.
def parse_date(date_value):

    try:

        if not date_value:
            return None

        parsed_date = parsedate_to_datetime(date_value)

        return parsed_date.date()

    except Exception:

        return None


# Fetch jobs from We Work Remotely RSS feed.
def fetch_weworkremotely():

    url = "https://weworkremotely.com/remote-jobs.rss"

    jobs = []

    try:

        response = requests.get(
            url,
            timeout=15
        )

        response.raise_for_status()

        root = ET.fromstring(response.text)

        for item in root.findall(".//item"):

            title = item.findtext("title", "")

            description = item.findtext(
                "description",
                ""
            )

            link = item.findtext(
                "link",
                ""
            )

            guid = item.findtext(
                "guid",
                link
            )

            pub_date = item.findtext(
                "pubDate",
                ""
            )


            # Extract company from title.
            # Example:
            # Company: Job Title
            company = ""

            if ":" in title:

                company, title = title.split(
                    ":",
                    1
                )

                company = company.strip()

                title = title.strip()


            mapped_job = {

                "title": title,

                "company": company
                or "Unknown",

                "location": "Remote",

                "country": "Remote",

                "job_type": "remote",

                "description": description,

                "requirements": "",

                "salary_min": None,

                "salary_max": None,

                "currency": "",

                "source": "weworkremotely",

                "source_url": link,

                "source_id": guid,

                "is_remote": True,

                "date_posted": parse_date(
                    pub_date
                ),

            }


            normalized_job = normalize_job(
                mapped_job
            )


            if normalized_job:

                jobs.append(
                    normalized_job
                )


    except Exception as error:

        print(
            f"WeWorkRemotely scraper failed: {error}"
        )
        logger.exception("Scraper failed")


    return jobs