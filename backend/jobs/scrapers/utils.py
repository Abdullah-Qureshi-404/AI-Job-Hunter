"""
Shared helper functions used by all job scrapers.
"""

import re
import math
import requests


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
            return None
        
        response.raise_for_status()

        return response.json()

    except Exception as error:

        print(f"Request failed: {url}")

        print(error)

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