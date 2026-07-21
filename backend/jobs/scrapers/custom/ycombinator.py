"""
Fetch jobs from Y Combinator's Work at a Startup.

Scrapes job listings from workatastartup.com.
The page uses Inertia.js which embeds all data as JSON
inside a data-page attribute on a single <div>.
No login or API key required.
"""

import json
import re
import time

import requests
from bs4 import BeautifulSoup

from jobs.scrapers.base import normalize_job


# The jobs listing page on Work at a Startup.
YC_JOBS_URL = "https://www.workatastartup.com/jobs"

# Use a real browser User-Agent so the server returns full HTML.
# Without this the server returns 406 Not Acceptable.
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


# Fetch jobs from Y Combinator's Work at a Startup board.
def fetch_ycombinator():

    jobs = []

    try:

        print("Searching Y Combinator...")

        raw_jobs = fetch_yc_job_list()

        if not raw_jobs:
            print("YC: no jobs found in page data.")
            return jobs

        print(f"YC jobs found: {len(raw_jobs)}")

        for item in raw_jobs:

            mapped_job = map_yc_job(item)

            if not mapped_job:
                continue

            normalized = normalize_job(mapped_job)

            if normalized:
                jobs.append(normalized)

    except Exception as error:

        print(f"YC scraper failed: {error}")

    print(f"YC jobs: {len(jobs)}")

    return jobs


# Fetch the raw HTML from the YC jobs page and extract
# the embedded JSON data from the Inertia.js data-page attribute.
def fetch_yc_job_list():

    try:

        response = requests.get(
            YC_JOBS_URL,
            headers=REQUEST_HEADERS,
            timeout=30,
        )

        response.raise_for_status()

        return parse_inertia_jobs(response.text)

    except Exception as error:

        print(f"YC fetch failed: {error}")

        return []


# Parse the Inertia.js data-page attribute from the HTML.
# Inertia.js apps embed all page data as JSON in a data-page
# attribute on a single root div instead of using __NEXT_DATA__.
def parse_inertia_jobs(html):

    soup = BeautifulSoup(html, "html.parser")

    # Find the root div that contains the data-page attribute.
    root_div = soup.find("div", attrs={"data-page": True})

    if not root_div:
        print("YC: data-page div not found.")
        return []

    raw_json = root_div.get("data-page", "")

    if not raw_json:
        return []

    data = json.loads(raw_json)

    props = data.get("props", {})

    # The jobs list is directly inside props on the jobs page.
    job_list = props.get("jobs", [])

    return job_list


# Convert a single YC job dict into the common job format.
def map_yc_job(item):

    try:

        job_id = item.get("id")
        title = (item.get("title") or "").strip()

        if not title or not job_id:
            return None

        # Build the direct job URL using the job ID.
        job_url = f"https://www.workatastartup.com/jobs/{job_id}"

        company_name = item.get("companyName") or item.get("company_name") or ""
        location = item.get("location") or "Remote"

        salary_string = item.get("salary") or ""
        salary_min, salary_max = parse_salary(salary_string)

        # Detect currency from salary string.
        # Default to USD but switch to INR for Indian rupee salaries.
        currency = detect_currency(salary_string)

        is_remote = detect_remote(item, location)

        country = extract_country_from_location(location)

        return {
            "title": title,
            "company": company_name,
            "location": location,
            "country": country,
            "job_type": detect_job_type(item.get("jobType") or item.get("job_type")),
            "description": item.get("companyOneLiner") or "",
            "requirements": "",
            "salary_min": salary_min,
            "salary_max": salary_max,
            "currency": currency,
            "source": "ycombinator",
            "source_url": job_url,
            "source_id": str(job_id),
            "is_remote": is_remote,
            "date_posted": None,
        }

    except Exception as error:

        print(f"YC job mapping failed: {error}")

        return None


# Parse a YC salary string into integer min and max values.
# Real formats seen: "$90K - $160K", "$120,000 - $180,000",
# "₹10K - ₹15K INR / monthly"
def parse_salary(salary_string):

    if not salary_string:
        return None, None

    try:

        # Remove currency symbols, commas, and suffixes.
        cleaned = (
            salary_string
            .replace("$", "")
            .replace(",", "")
            .replace("₹", "")
            .replace("INR", "")
            .replace("/ monthly", "")
            .replace("/monthly", "")
            .lower()
        )

        # Convert "k" shorthand to full number (e.g. "90k" -> "90000").
        cleaned = re.sub(
            r"(\d+)k",
            lambda m: str(int(m.group(1)) * 1000),
            cleaned
        )

        # Extract all numbers from the cleaned string.
        numbers = re.findall(r"\d+", cleaned)

        if len(numbers) >= 2:
            return int(numbers[0]), int(numbers[1])

        if len(numbers) == 1:
            return int(numbers[0]), None

        return None, None

    except Exception:

        return None, None


# Detect the currency from the salary string.
# YC jobs are mostly USD but Indian companies use INR.
def detect_currency(salary_string):

    if not salary_string:
        return "USD"

    if "₹" in salary_string or "INR" in salary_string:
        return "INR"

    return "USD"


# Map YC job type values to our standard job type choices.
# YC uses: "Fulltime", "Intern", "Part-time", "Contract", "Remote"
def detect_job_type(job_type_raw):

    raw = (job_type_raw or "").lower().strip()

    if "intern" in raw:
        return "internship"

    if "part" in raw:
        return "part-time"

    if "contract" in raw or "freelance" in raw:
        return "freelance"

    if "remote" in raw:
        return "remote"

    return "full-time"


# Detect whether a job is remote based on jobType or location text.
def detect_remote(item, location):

    job_type_raw = (item.get("jobType") or item.get("job_type") or "").lower()

    if "remote" in job_type_raw:
        return True

    location_lower = (location or "").lower()

    remote_keywords = ["remote", "anywhere", "worldwide", "work from home"]

    for keyword in remote_keywords:
        if keyword in location_lower:
            return True

    return False


# Extract a 2-letter country code from a YC location string.
# YC location format: "City, State, COUNTRY_CODE"
# Example: "San Francisco, CA, US" -> "US"
def extract_country_from_location(location):

    if not location:
        return ""

    parts = [p.strip() for p in location.split(",")]

    if parts:
        last_part = parts[-1].strip()
        # YC country codes are exactly 2 uppercase letters.
        if len(last_part) == 2 and last_part.isalpha():
            return last_part.upper()

    return ""