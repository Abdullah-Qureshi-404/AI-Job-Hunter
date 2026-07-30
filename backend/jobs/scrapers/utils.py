"""
Shared helper functions used by all job scrapers.
"""

import re
import math
import requests

from jobs.logger import get_scraper_logger

logger = get_scraper_logger("utils")


DEFAULT_HEADERS = {

    "User-Agent": (
        "Mozilla/5.0 "
        "(Windows NT 10.0; Win64; x64) "
        "AI-Job-Hunter"
    )

}

def clean_html(text):

    if not text:
        return ""

    clean_text = re.sub(
        "<.*?>",
        "",
        text
    )

    return clean_text.strip()


# This function downloads JSON data from an API.
def fetch_json(url):

    try:

        response = requests.get(

            url,

            headers=DEFAULT_HEADERS,

            timeout=20,

        )

        if response.status_code == 404:
            print(f"API endpoint not found: {url}")
            logger.info(f"API endpoint not found: {url}")
            return None
        
        response.raise_for_status()

        return response.json()

    except Exception as error:

        print(f"Request failed: {url}")

        print(error)
        logger.exception("Scraper failed")

        return None


def safe_string(value):

    if value is None:
        return ""

    if isinstance(value, float):

        if math.isnan(value):
            return ""

    text = str(value).strip()

    if text.lower() == "nan":
        return ""

    return text


# This function safely converts values into integers.
def safe_int(value):

    if value is None:
        return None

    if isinstance(value, float):

        if math.isnan(value):
            return None

    try:

        text = str(value).strip()

        if text.lower() == "nan":
            return None

        if text == "":
            return None

        return int(float(text))

    except Exception:

        return None


# This function checks whether text contains remote keywords.
def contains_remote(text):

    text = safe_string(text).lower()

    keywords = [

        "remote",

        "worldwide",

        "anywhere",

        "global",

        "work from home",

    ]

    for keyword in keywords:

        if keyword in text:
            return True

    return False


# This function returns a country if available.
def extract_country(location):

    location = safe_string(location)

    if "," not in location:
        return ""

    return location.split(",")[-1].strip()

# Section headings that introduce the requirements/qualifications part of a
# job posting. Matched case-insensitively at the start of a line.
REQUIREMENT_HEADINGS = (
    "requirement",
    "qualification",
    "what you need",
    "what we are looking for",
    "what we're looking for",
    "who you are",
    "skills",
    "must have",
    "must-have",
    "you have",
    "you should have",
    "minimum qualification",
    "basic qualification",
    "experience required",
)

# Headings that mark the END of the requirements section.
NEXT_SECTION_HEADINGS = (
    "benefit",
    "we offer",
    "perks",
    "compensation",
    "salary",
    "about us",
    "about the company",
    "how to apply",
    "application process",
    "equal opportunity",
    "our culture",
    "why join",
)


def _is_heading_for(line, headings):
    stripped = line.strip().lstrip("#*-•> ").lower()

    if not stripped or len(stripped) > 80:
        return False

    return any(stripped.startswith(word) for word in headings)


def extract_requirements(description):
    """
    Pull the requirements/qualifications section out of a job description.

    Scrapers receive one combined description from every upstream API, so the
    requirements field would otherwise always be empty. Returns "" when no
    recognisable section exists - better an honest empty value than a guess.
    """

    if not description:
        return ""

    lines = description.replace("\r\n", "\n").split("\n")

    start = None

    for index, line in enumerate(lines):
        if _is_heading_for(line, REQUIREMENT_HEADINGS):
            start = index + 1
            break

    if start is None:
        return ""

    collected = []

    for line in lines[start:]:
        if _is_heading_for(line, NEXT_SECTION_HEADINGS):
            break
        collected.append(line)

    result = "\n".join(collected).strip()

    # A couple of words is not a section worth showing.
    return result if len(result) >= 30 else ""
