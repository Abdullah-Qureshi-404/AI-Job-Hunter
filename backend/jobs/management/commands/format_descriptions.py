"""
Reformat scraped job descriptions into readable structure using an LLM.

Runs offline, after scraping - never during a page view. Formatting a
description on demand would add 1-3 seconds every time a user opens a job,
which is exactly the latency we have been removing everywhere else. Doing it
once and storing the result keeps job pages instant.

The model is instructed to reorganise ONLY: it may add headings, split
paragraphs and turn run-on sentences into bullets, but it may not reword,
summarise or invent. Output is verified against the source before saving, and
skipped if the model altered the wording.

    python manage.py format_descriptions --limit 50
    python manage.py format_descriptions --dry-run
"""

import os
import re

from django.core.management.base import BaseCommand

from jobs.models import Job
from jobs.logger import get_scraper_logger

logger = get_scraper_logger("format_descriptions")


PROMPT = """Reformat this job description so it is easy to read.

STRICT RULES - you are formatting, not writing:
- Do NOT change, reword, summarise or translate any sentence.
- Do NOT add any new information, or remove any information.
- Every word in your output must appear in the input.

You MAY:
- Add short section headings (Responsibilities, Requirements, Benefits, About
  the Role) ONLY where the text below already covers that topic.
- Split walls of text into paragraphs.
- Turn lists of items into bullet points starting with "- ".
- Remove duplicated whitespace, navigation junk and boilerplate like
  "Apply now" or cookie notices.

Return plain text only. No markdown bold, no asterisks, no commentary.

JOB DESCRIPTION:
{description}
"""


def word_multiset(text):
    return sorted(re.findall(r"[a-z0-9]+", text.lower()))


def is_faithful(original, formatted):
    """
    Reject output that rewrote or dropped meaningful content.

    Measured by volume rather than by distinct words: adding section headings
    introduces a handful of new tokens, whereas an actual rewrite changes a
    large share of them. Two thresholds:

      * invented tokens must be under 3% of the output
      * the output must still contain at least 80% of the source's vocabulary,
        so summarising is caught as well as embellishing
    """

    if not formatted or len(formatted) < 40:
        return False

    original_words = set(word_multiset(original))
    formatted_tokens = word_multiset(formatted)

    if not formatted_tokens or not original_words:
        return False

    # Words a heading may legitimately introduce. Excluded from the invented
    # count so that short descriptions are not dominated by their own headings.
    heading_words = {
        "about", "the", "us", "role", "overview", "position", "summary",
        "description", "job", "responsibilities", "requirements", "duties",
        "qualifications", "skills", "benefits", "perks", "offer", "we",
        "what", "you", "will", "do", "our", "company", "and",
    }

    invented = [
        w for w in formatted_tokens
        if w not in original_words and w not in heading_words
    ]
    invented_ratio = len(invented) / len(formatted_tokens)

    retained = len(original_words & set(formatted_tokens)) / len(original_words)

    return invented_ratio <= 0.03 and retained >= 0.80


class Command(BaseCommand):

    help = "Reformat job descriptions for readability using Groq."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--force", action="store_true", help="Reformat already-formatted jobs too.")

    def handle(self, *args, **options):
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            self.stderr.write("GROQ_API_KEY is not set.")
            return

        from groq import Groq

        client = Groq(api_key=api_key)

        queryset = Job.objects.exclude(description="").filter(is_active=True)

        if not options["force"]:
            queryset = queryset.filter(description_formatted="")

        jobs = list(queryset.order_by("-date_posted")[: options["limit"]])

        self.stdout.write(f"Formatting {len(jobs)} descriptions...")

        done = skipped = failed = 0

        for job in jobs:
            source = job.description.strip()

            # Already tidy: has headings or bullets and reasonable line breaks.
            if source.count("\n") > 5 and re.search(r"^\s*[-•]", source, re.M):
                skipped += 1
                continue

            try:
                completion = client.chat.completions.create(
                    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You reformat text for readability. You never "
                                "change wording and never add facts."
                            ),
                        },
                        {"role": "user", "content": PROMPT.format(description=source[:12000])},
                    ],
                    temperature=0,
                )

                formatted = (completion.choices[0].message.content or "").strip()
                formatted = re.sub(r"\*\*(.+?)\*\*", r"\1", formatted)

                if not is_faithful(source, formatted):
                    self.stdout.write(f"  [rejected - not faithful] {job.title[:50]}")
                    skipped += 1
                    continue

                if options["dry_run"]:
                    self.stdout.write(f"  [would format] {job.title[:50]}")
                else:
                    job.description_formatted = formatted
                    job.save(update_fields=["description_formatted"])
                    self.stdout.write(f"  [ok] {job.title[:50]}")

                done += 1

            except Exception as error:
                logger.exception("Formatting failed for job %s", job.id)
                self.stderr.write(f"  [failed] {job.title[:50]}: {error}")
                failed += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nFormatted {done}, skipped {skipped}, failed {failed}."
            )
        )
