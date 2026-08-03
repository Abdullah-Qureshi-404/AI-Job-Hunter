"""
=========================================================
PDF text repair
=========================================================

pypdf frequently drops the space between glyphs when a PDF positions each word
separately. Real output from a resume in this project:

    "MERN Stack DeveloperJune 2025"
    "TaughtMathematics,Computer,andSciencesubjects"

Embedded as-is, those become tokens that match nothing, so the chunk is
effectively invisible to retrieval. Repairing the spacing measurably improves
every RAG answer built on the document.

Only unambiguous boundaries are split. Known CamelCase technology names are
protected first, because splitting "PostgreSQL" into "Postgre SQL" would break
exactly the skill matching this is meant to help.
"""

import re


# CamelCase technology names that must survive the lower|Upper split.
PROTECTED_TERMS = [
    "PostgreSQL", "MySQL", "NoSQL", "GraphQL", "MongoDB", "DynamoDB",
    "JavaScript", "TypeScript", "NodeJS", "NextJS", "ReactJS", "VueJS",
    "AngularJS", "ExpressJS", "JQuery",
    "GitHub", "GitLab", "BitBucket", "DevOps", "MLOps", "GitOps",
    "PyTorch", "TensorFlow", "SciKit", "NumPy", "SciPy", "OpenCV", "OpenAI",
    "LangChain", "LlamaIndex", "HuggingFace", "FastAPI", "RESTful",
    "PowerBI", "PowerShell", "VSCode", "IntelliJ", "WordPress", "WooCommerce",
    "MacOS", "AndroidStudio", "XGBoost", "LightGBM", "CatBoost",
]

# Longest first, so "NextJS" is protected before a shorter overlapping term.
_ORDERED_TERMS = sorted(PROTECTED_TERMS, key=len, reverse=True)

_PLACEHOLDER = "{}"  # private-use char: cannot occur in resume text


def repair_spacing(text: str) -> str:
    """Reinsert spaces lost during PDF extraction."""

    if not text:
        return text

    # 1. Hide protected terms.
    protected = {}

    for index, term in enumerate(_ORDERED_TERMS):
        placeholder = _PLACEHOLDER.format(index)
        pattern = re.compile(re.escape(term), re.IGNORECASE)

        if pattern.search(text):
            text = pattern.sub(placeholder, text)
            protected[placeholder] = term

    # 2. Split unambiguous boundaries.
    #    lower|Upper -> "developerJune"
    text = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", text)

    #    punctuation immediately followed by a letter -> "code,reviewing"
    text = re.sub(r"(?<=[,;:])(?=[A-Za-z])", " ", text)

    #    letter immediately followed by a 4-digit year -> "Developer2025"
    text = re.sub(r"(?<=[A-Za-z])(?=(?:19|20)\d{2}\b)", " ", text)

    # 3. Collapse repeated spaces/tabs, preserving newlines.
    text = re.sub(r"[ \t]{2,}", " ", text)

    # 4. Restore protected terms.
    for placeholder, term in protected.items():
        text = text.replace(placeholder, term)

    return text
