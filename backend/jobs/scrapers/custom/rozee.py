"""
Rozee.pk custom scraper using Playwright.
"""

from playwright.sync_api import sync_playwright

from ..base import normalize_job


ROZEE_URL = "https://www.rozee.pk/job/jsearch/q/software"



# Fetch jobs from Rozee using browser automation.
def fetch_rozee_jobs():

    jobs = []


    try:

        print("Searching Rozee.pk...")


        with sync_playwright() as p:


            browser = p.chromium.launch(
                headless=False
            )


            page = browser.new_page(
                user_agent=(
                    "Mozilla/5.0 "
                    "(Windows NT 10.0; Win64; x64) "
                    "Chrome/120 Safari/537.36"
                )
            )


            page.goto(
                ROZEE_URL,
                wait_until="domcontentloaded",
                timeout=60000
            )


            html = page.content()


            print(
                "Rozee page loaded"
            )


            # Temporary debug.
            print(
                html[:500]
            )


            browser.close()



    except Exception as error:

        print(
            f"Rozee scraper failed: {error}"
        )


    print(
        f"Rozee jobs: {len(jobs)}"
    )


    return jobs


# Backwards-compatible alias expected by registry
fetch_rozee = fetch_rozee_jobs