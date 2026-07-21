"""
Fetch jobs from Lever job boards.

Lever exposes a free public API for each company.
No authentication required.
Endpoint: https://api.lever.co/v0/postings/{company}?mode=json
"""

from jobs.scrapers.base import normalize_job
from jobs.scrapers.utils import fetch_json
from jobs.scrapers.utils import extract_country


# Companies using Lever as their ATS.
# Every slug here is verified from an actual jobs.lever.co/{slug} URL.
# To add more: visit jobs.lever.co/{company-name} in your browser.
# If the page loads with job listings, the slug is valid — add it here.
LEVER_COMPANIES = [
    # Verified from jobs.lever.co URLs in search results
    "upguard",
    "nimblerx",
    "pattern",
    "copper-company",
    "copilotkit",
    "leverdemo",   # Lever's own demo board - always has jobs, good for testing
]


# This function fetches jobs from all Lever company boards.
def fetch_lever():

    jobs = []

    for company in LEVER_COMPANIES:

        company_jobs = fetch_lever_company(company)

        jobs.extend(company_jobs)

    return jobs


# This function fetches jobs for a single Lever company.
def fetch_lever_company(company):

    jobs = []

    url = (
        f"https://api.lever.co/v0/postings/{company}"
        "?mode=json"
    )

    data = fetch_json(url)

    # Lever returns a list directly, not a dict with a key.
    if not data or not isinstance(data, list):
        return jobs

    for item in data:

        mapped_job = map_lever_job(item, company)

        if not mapped_job:
            continue

        job = normalize_job(mapped_job)

        if job:
            jobs.append(job)

    return jobs


# This function converts a single Lever job into the common format.
def map_lever_job(item, company):

    try:

        job_id = item.get("id")

        # Lever stores the job title in "text" not "title".
        title = item.get("text", "")

        if not title or not job_id:
            return None

        # Location, team, and job type live inside "categories".
        categories = item.get("categories", {})

        location = categories.get("location", "") or "Remote"

        # "commitment" is Lever's field for full-time/part-time/contract.
        commitment = categories.get("commitment", "")

        # Lever uses "workplaceType" for remote detection.
        # Values seen: "remote", "hybrid", "on-site"
        workplace_type = item.get("workplaceType", "").lower()

        is_remote = detect_remote(workplace_type, location)

        salary_min, salary_max, currency = parse_salary(
            item.get("salaryRange", {})
        )

        # Use plain text description to avoid saving raw HTML.
        description = item.get("descriptionPlain", "") or ""

        # hostedUrl is the public job listing URL.
        source_url = item.get("hostedUrl", "")

        # createdAt is a Unix timestamp in milliseconds.
        date_posted = parse_date(item.get("createdAt"))

        return {

            "title": title,

            "company": company,

            "location": location,

            "country": extract_country(location),

            "job_type": detect_job_type(commitment, is_remote),

            "description": description,

            "requirements": "",

            "salary_min": salary_min,

            "salary_max": salary_max,

            "currency": currency,

            "source": "lever",

            "source_url": source_url,

            "source_id": job_id,

            "is_remote": is_remote,

            "date_posted": date_posted,

        }

    except Exception as error:

        print(f"Lever job mapping failed for {company}: {error}")

        return None


# Detect whether a job is remote based on workplaceType and location.
def detect_remote(workplace_type, location):

    if workplace_type == "remote":
        return True

    location_lower = (location or "").lower()

    remote_keywords = [
        "remote",
        "anywhere",
        "worldwide",
        "work from home",
    ]

    for keyword in remote_keywords:
        if keyword in location_lower:
            return True

    return False


# Map Lever commitment values to our standard job type choices.
# Lever uses: "Full-time", "Part-time", "Contract", "Internship"
def detect_job_type(commitment, is_remote):

    commitment_lower = (commitment or "").lower()

    if "intern" in commitment_lower:
        return "internship"

    if "part" in commitment_lower:
        return "part-time"

    if "contract" in commitment_lower or "freelance" in commitment_lower:
        return "freelance"

    if is_remote:
        return "remote"

    return "full-time"


# Parse the Lever salaryRange dict into min, max, and currency.
# Lever salaryRange looks like:
# {"min": 100000, "max": 150000, "currency": "USD", "interval": "per-year"}
def parse_salary(salary_range):

    if not salary_range or not isinstance(salary_range, dict):
        return None, None, "USD"

    salary_min = salary_range.get("min")
    salary_max = salary_range.get("max")
    currency = salary_range.get("currency") or "USD"

    return salary_min, salary_max, currency


# Convert Lever's createdAt Unix timestamp (milliseconds) to a date string.
def parse_date(created_at):

    if not created_at:
        return None

    try:

        from datetime import datetime

        # Lever timestamps are in milliseconds so divide by 1000.
        timestamp_seconds = int(created_at) / 1000

        return datetime.fromtimestamp(timestamp_seconds).date()

    except Exception:

        return None