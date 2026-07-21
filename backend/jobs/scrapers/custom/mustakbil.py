"""
Mustakbil custom scraper.

Scrapes jobs from Mustakbil.com
and converts them into common job format.
"""

import re
import requests
import time
from datetime import datetime, date, timedelta
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

from ..base import normalize_job


MUSTAKBIL_URL = "https://www.mustakbil.com/jobs/pakistan"

# Material Icons that Mustakbil renders as icon glyphs but BeautifulSoup
# reads as plain text. We strip these everywhere they appear.
ICON_LIGATURES = {
    "open_in_new", "arrow_forward", "arrow_back", "location_on",
    "work_outline", "schedule", "group_add", "flight", "trending_up",
    "work_history", "school", "history", "event", "send", "lock",
    "flag", "category", "business", "payments", "wifi", "rate_review",
    "star", "favorite_border", "verified_user", "timeline",
    "check_circle", "bookmark_add", "location_city",
}

# Build a single regex that matches any icon ligature as a whole word.
_ICON_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(i) for i in ICON_LIGATURES) + r")\b"
)


# Remove Material Icon ligature strings from a piece of text.
def strip_icons(text):
    return _ICON_PATTERN.sub("", text).strip()


# Pakistani cities to check for location extraction.
PAKISTANI_CITIES = [
    "Lahore",
    "Karachi",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
    "Sialkot",
    "Gujranwala",
]


# Fetch job list from Mustakbil.
def fetch_mustakbil():

    jobs = []

    try:

        print("Searching Mustakbil...")

        with sync_playwright() as p:

            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.goto(
                MUSTAKBIL_URL,
                wait_until="networkidle",
                timeout=90000,
            )

            page.wait_for_timeout(3000)

            html = page.content()
            browser.close()

        soup = BeautifulSoup(html, "html.parser")

        links = soup.find_all("a", href=True)

        job_links = []

        for link in links:

            url = link.get("href")
            title = link.get_text(strip=True)

            if not url:
                continue

            if "/jobs/job/" in url:

                if url.startswith("/"):
                    url = "https://www.mustakbil.com" + url

                if title and title not in ["View jobarrow_forward"]:
                    job_links.append((title, url))

        print("Jobs found:", len(job_links))

        # Limit to avoid too many requests.
        for title, url in job_links[:20]:

            time.sleep(2)

            detail_job = fetch_mustakbil_details(url)

            if not detail_job:
                continue

            normalized = normalize_job(detail_job)

            if normalized:
                jobs.append(normalized)

    except Exception as error:
        print(f"Mustakbil scraper failed: {error}")

    print(f"Mustakbil jobs: {len(jobs)}")

    return jobs


# Extract the job content section from the page soup.
# Mustakbil wraps job details in a main container.
# We isolate this region so later extractions don't
# accidentally read footer or navigation content.
def extract_job_section(soup):
    """
    Return the BeautifulSoup element that contains the actual
    job details, or None if it cannot be found.
    """

    # Try common container selectors used by Mustakbil.
    for selector in [
        {"class": re.compile(r"job.?detail", re.I)},
        {"class": re.compile(r"job.?content", re.I)},
        {"class": re.compile(r"job.?description", re.I)},
        {"id": re.compile(r"job.?detail", re.I)},
        {"role": "main"},
    ]:
        section = soup.find(attrs=selector)
        if section:
            return section

    # Fall back to <main> tag.
    main = soup.find("main")
    if main:
        return main

    # Last resort: use the full soup but caller must be aware.
    return None


# Extract company name from the Mustakbil job page.
# Mustakbil does not use a "Company:" label in body text.
# Instead the company appears in two predictable places:
#   1. The <h1> or page title: "Job Title in Company Name City, Country"
#   2. A dedicated company link/element near the job header.
def extract_company(soup, title_text):
    """
    Return company name string, or empty string if not found.
    """

    # Strategy 1: dedicated company element (most reliable).
    # Mustakbil often renders company name as a link with a
    # class containing "company" near the job header.
    for selector in [
        {"class": re.compile(r"company", re.I)},
        {"class": re.compile(r"employer", re.I)},
        {"itemprop": "hiringOrganization"},
        {"itemprop": "name"},
    ]:
        el = soup.find(attrs=selector)
        if el:
            name = strip_icons(el.get_text(strip=True))
            if name and len(name) < 120:
                return name

    # Strategy 2: parse the page <title> tag.
    # Mustakbil page titles follow:
    # "Job Title in Company Name | Mustakbil"
    page_title_tag = soup.find("title")
    if page_title_tag:
        page_title = page_title_tag.get_text(strip=True)
        # Strip the site suffix.
        page_title = re.sub(r"\s*\|.*$", "", page_title).strip()
        # Pattern: "Job Title in Company Name"
        match = re.search(r"\bin\b(.+)$", page_title, re.I)
        if match:
            candidate = strip_icons(match.group(1).strip())
            # Reject if the candidate looks like a city/location only.
            if candidate and not _is_location_only(candidate):
                return candidate

    # Strategy 3: parse the job title text itself.
    # The link text on the listing page uses the same pattern:
    # "Junior Closer - Final Expense Job in Olympia Sunrise Services (Pvt) Ltd Rawalpindi, Pakistan"
    if title_text:
        match = re.search(r"\bJob in\b(.+?)(?:\s+(?:Lahore|Karachi|Islamabad|Rawalpindi|Faisalabad|Multan|Peshawar|Quetta|Pakistan).*)?$", title_text, re.I)
        if match:
            candidate = strip_icons(match.group(1).strip())
            if candidate and not _is_location_only(candidate):
                return candidate

    return ""


# Return True if the string looks like a bare city/country name
# rather than a company name.
def _is_location_only(text):
    location_words = {
        "pakistan", "lahore", "karachi", "islamabad",
        "rawalpindi", "faisalabad", "multan", "peshawar",
    }
    return text.strip().lower() in location_words


# Extract location from the job details section only.
# We look inside the isolated job section, not the full page,
# so footer city links do not cause false positives.
def extract_location(job_section, fallback_title=""):
    """
    Return the most specific location string found in the job
    content area, defaulting to "Pakistan".
    """

    if job_section is None:
        return "Pakistan"

    # Get text only from the job section element.
    section_text = job_section.get_text(" ", strip=True)

    # Check for explicit remote/WFH in this section only.
    remote_signals = ["work from home", "remote", "anywhere", "worldwide"]
    lower_section = section_text.lower()
    for signal in remote_signals:
        if signal in lower_section:
            return "Remote"

    # Look for city names in the job section text.
    for city in PAKISTANI_CITIES:
        if city in section_text:
            return city

    # Fall back to checking the listing page title text.
    for city in PAKISTANI_CITIES:
        if city in fallback_title:
            return city

    return "Pakistan"


# Detect whether the job itself (not the website) indicates remote work.
# We check only within the job description section to avoid footer noise.
def detect_remote(job_section, title):
    """
    Return True only if the actual job content signals remote work.
    """

    title_lower = (title or "").lower()

    # Keywords that strongly indicate remote in the job title.
    remote_title_signals = ["remote", "work from home", "wfh", "worldwide", "anywhere"]
    for signal in remote_title_signals:
        if signal in title_lower:
            return True

    if job_section is None:
        return False

    # Get only the job section text, strip to a reasonable length
    # so we don't process thousands of characters unnecessarily.
    section_text = job_section.get_text(" ", strip=True)[:3000].lower()

    # Keywords that must appear in job content to count as remote.
    remote_content_signals = [
        "remote",
        "work from home",
        "work-from-home",
        "wfh",
        "fully remote",
        "100% remote",
        "worldwide",
        "anywhere in the world",
    ]

    # Keywords that override and mean on-site even if "remote" appears.
    # e.g. "not a remote position", "no remote work"
    onsite_overrides = [
        "not remote",
        "no remote",
        "onsite",
        "on-site",
        "on site",
        "office only",
        "must be present",
        "must report",
    ]

    for override in onsite_overrides:
        if override in section_text:
            return False

    for signal in remote_content_signals:
        if signal in section_text:
            return True

    return False


# Parse date strings from Mustakbil job pages into a Python date object.
# Mustakbil uses formats like "Posted Jun 24, 2026",
# "Posted yesterday", and "Posted 5 days ago".
def parse_posted_date(text):
    """
    Return a datetime.date or None if no date can be parsed.
    """

    today = date.today()

    # "Posted yesterday"
    if re.search(r"\byesterday\b", text, re.I):
        return today - timedelta(days=1)

    # "Posted N days ago"
    days_ago_match = re.search(r"(\d+)\s+days?\s+ago", text, re.I)
    if days_ago_match:
        return today - timedelta(days=int(days_ago_match.group(1)))

    # "Posted Jun 24, 2026" or "Posted 24 Jun, 2026"
    date_formats = [
        r"Posted\s+([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})",  # Jun 24, 2026
        r"Posted\s+(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})",  # 24 Jun, 2026
    ]

    for pattern in date_formats:
        match = re.search(pattern, text, re.I)
        if match:
            groups = match.groups()
            try:
                # Detect which group is month vs day.
                if groups[0].isalpha():
                    month_str, day_str, year_str = groups
                else:
                    day_str, month_str, year_str = groups

                dt = datetime.strptime(
                    f"{day_str} {month_str} {year_str}", "%d %b %Y"
                )
                return dt.date()
            except ValueError:
                continue

    # "Posted today"
    if re.search(r"\btoday\b", text, re.I):
        return today

    return None


# Extract a clean job description from the job content section only.
# We strip navigation, footer, and recommendations by working
# only within the isolated job details element.
def extract_description(soup, job_section):
    """
    Return a cleaned description string containing only job-relevant text.
    """

    if job_section is None:
        # Fallback: try to remove known noisy elements from the full soup
        # before extracting text.
        for tag in soup.find_all(
            ["nav", "footer", "header", "script", "style", "noscript"]
        ):
            tag.decompose()
        text = soup.get_text("\n", strip=True)
    else:
        text = job_section.get_text("\n", strip=True)

    # Remove lines that look like navigation / UI chrome.
    # These patterns appear in Mustakbil's rendered job pages.
    noise_patterns = [
        r"^Sign (up|in|out)",
        r"^Log(in|out| in| out)",
        r"^Register",
        r"^Home\s*$",
        r"^Jobs\s*$",
        r"^Find Jobs",
        r"^Browse Jobs",
        r"^Remote jobs",
        r"^Work from anywhere",
        r"^Post a Job",
        r"^Recommended jobs",
        r"^Similar jobs",
        r"^You may also like",
        r"^All rights reserved",
        r"^\d+\s*job(s)?\s*found",
        r"^Copyright",
        r"^Privacy Policy",
        r"^Terms",
        r"^Cookie",
    ]

    cleaned_lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Skip lines that are purely an icon ligature with nothing else.
        if line in ICON_LIGATURES:
            continue
        # Strip inline icon ligatures from lines that have real content.
        line = strip_icons(line)
        if not line:
            continue
        # Skip lines matching noise patterns.
        is_noise = any(re.match(p, line, re.I) for p in noise_patterns)
        if not is_noise:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


# Fetch complete job details from a Mustakbil job page.
def fetch_mustakbil_details(url, listing_title=""):
    """
    Download a single job page and extract structured fields.
    Returns a raw job dict or None on failure.
    """

    try:

        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=20,
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Isolate the job content section first.
        # All subsequent extractions use this bounded region
        # to avoid reading footer/nav content.
        job_section = extract_job_section(soup)

        full_text = soup.get_text("\n", strip=True)

        # --- Title ---
        title = ""
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

        # --- Company ---
        # Pass listing_title (from the job list link text) as a
        # fallback because it contains the "Job in Company" pattern.
        company = extract_company(soup, listing_title or title)

        # --- Location ---
        location = extract_location(job_section, fallback_title=listing_title or title)

        # --- Salary ---
        salary_min = None
        salary_max = None

        salary_match = re.search(r"([\d,]+)[–\-]([\d,]+)", full_text)
        if salary_match:
            salary_min = int(salary_match.group(1).replace(",", ""))
            salary_max = int(salary_match.group(2).replace(",", ""))

        # --- Remote ---
        is_remote = detect_remote(job_section, title)

        # --- Date posted ---
        # Search in the job section text first, then full page text.
        date_search_text = (
            job_section.get_text(" ", strip=True) if job_section else full_text
        )
        date_posted = parse_posted_date(date_search_text)

        # --- Description ---
        description = extract_description(soup, job_section)

        return {
            "title": title,
            "company": company,
            "location": location,
            "country": "Pakistan",
            "job_type": "full-time",
            "description": description,
            "requirements": "",
            "salary_min": salary_min,
            "salary_max": salary_max,
            "currency": "PKR",
            "source": "mustakbil",
            "source_url": url,
            "source_id": url,
            "is_remote": is_remote,
            "date_posted": date_posted,
        }

    except Exception as error:
        print(f"Mustakbil detail failed: {error}")
        return None