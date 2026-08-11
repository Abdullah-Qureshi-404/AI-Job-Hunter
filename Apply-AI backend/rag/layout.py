"""
=========================================================
Resume layout detection
=========================================================

The goal is to reproduce the *structure* of the user's own resume - section
names, section order, column count, typeface family - without attempting to
clone its pixels.

Why not clone the pixels? PDF stores glyphs at coordinates, not a layout. To
rebuild a two-column design you would have to infer column boundaries, gutters,
line spacing, float behaviour and font metrics, then hope the reflow matches at
a different content length. It is brittle and it usually looks worse.

More importantly, the thing users actually want from a resume - passing the
ATS - is *hurt* by multi-column layouts. Most parsers read in a single pass and
interleave the columns, turning "Skills | Experience" into alternating
gibberish. So we detect the original layout, tell the user what we found, and
let them choose.

What we extract:
    columns        1 or 2, from x-coordinate clustering of text positions
    section_order  the user's own headings, in their order
    font_family    "serif" or "sans"
    header_align   "center" or "left"
"""

import io
import logging
import re
from collections import Counter

from pypdf import PdfReader

logger = logging.getLogger(__name__)


# Headings we recognise as resume sections, mapped to a canonical key.
SECTION_ALIASES = {
    "summary": "summary",
    "professional summary": "summary",
    "profile": "summary",
    "objective": "summary",
    "about": "summary",
    "skills": "skills",
    "technical skills": "skills",
    "core competencies": "skills",
    "expertise": "skills",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment": "experience",
    "employment history": "experience",
    "projects": "projects",
    "personal projects": "projects",
    "selected projects": "projects",
    "education": "education",
    "academic background": "education",
    "certifications": "certifications",
    "achievements": "achievements",
    "awards": "achievements",
}


def _collect_text_positions(pdf_bytes):
    """Return (x, y, text, font_size, font_name) tuples for the first page."""

    reader = PdfReader(io.BytesIO(pdf_bytes))

    if not reader.pages:
        return []

    items = []

    def visitor(text, cm, tm, font_dict, font_size):
        stripped = (text or "").strip()
        if not stripped:
            return
        # tm[4], tm[5] are the x/y translation of the text matrix.
        items.append(
            (
                round(tm[4], 1),
                round(tm[5], 1),
                stripped,
                font_size or 0,
                (font_dict or {}).get("/BaseFont", "") if isinstance(font_dict, dict) else "",
            )
        )

    try:
        reader.pages[0].extract_text(visitor_text=visitor)
    except Exception:
        logger.exception("Could not read text positions from PDF")
        return []

    return items


def detect_columns(items, page_width=612.0):
    """
    Two columns if a substantial share of text starts well right of centre
    while another substantial share starts on the left.
    """

    if len(items) < 20:
        return 1

    xs = [x for x, _, _, _, _ in items]

    midpoint = page_width / 2

    left = sum(1 for x in xs if x < midpoint * 0.85)
    right = sum(1 for x in xs if x > midpoint * 1.05)

    total = len(xs)

    # Both zones need real content, not just a date column on the right.
    if right / total >= 0.25 and left / total >= 0.25:
        # A right-hand date column tends to be narrow and consistent; a real
        # second column has many distinct x positions.
        distinct_right = len({round(x / 10) for x in xs if x > midpoint * 1.05})
        if distinct_right >= 3:
            return 2

    return 1


def detect_sections(text):
    """Return the user's section keys in the order they appear."""

    order = []
    seen = set()

    for raw_line in text.split("\n"):
        line = re.sub(r"[^A-Za-z ]", "", raw_line).strip().lower()

        if not line or len(line) > 40:
            continue

        key = SECTION_ALIASES.get(line)

        if key and key not in seen:
            seen.add(key)
            order.append(key)

    return order


def detect_font_family(items):
    fonts = Counter()

    for _, _, _, _, font_name in items:
        name = (font_name or "").lower()
        if not name:
            continue
        if any(token in name for token in ("times", "serif", "georgia", "garamond", "book")):
            fonts["serif"] += 1
        elif any(token in name for token in ("arial", "helvetica", "calibri", "sans", "roboto", "lato")):
            fonts["sans"] += 1

    if not fonts:
        return "sans"

    return fonts.most_common(1)[0][0]


def detect_header_alignment(items, page_width=612.0):
    """Centered name lines start near the middle of the page."""

    if not items:
        return "left"

    # The topmost few items are the header.
    top = sorted(items, key=lambda i: -i[1])[:4]

    centred = sum(1 for x, _, _, _, _ in top if x > page_width * 0.28)

    return "center" if centred >= len(top) / 2 else "left"


def analyze_layout(pdf_bytes, extracted_text=""):
    """
    Describe the uploaded resume's structure.

    Never raises: layout detection is an enhancement, and a failure here must
    not block an upload.
    """

    result = {
        "columns": 1,
        "section_order": [],
        "font_family": "sans",
        "header_align": "center",
        "ats_warning": None,
    }

    try:
        items = _collect_text_positions(pdf_bytes)

        if items:
            result["columns"] = detect_columns(items)
            result["font_family"] = detect_font_family(items)
            result["header_align"] = detect_header_alignment(items)

        result["section_order"] = detect_sections(extracted_text)

        if result["columns"] == 2:
            result["ats_warning"] = (
                "Your resume uses a two-column layout. Many applicant tracking "
                "systems read columns in a single pass and interleave them, "
                "which garbles the text. A single-column version of the same "
                "content usually scores higher."
            )

    except Exception:
        logger.exception("Layout analysis failed; using defaults")

    return result
