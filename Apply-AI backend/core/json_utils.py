"""
=========================================================
ApplyAI - LLM JSON helpers
=========================================================

Single home for parsing JSON out of a model response.

This logic previously existed in four places (job_service, composer, and
inline copies in profile_service and email_service). Two of them raised
different exception types, so identical model misbehaviour produced a
different HTTP status depending on which route you hit.
"""

import json
import re


class InvalidModelJSON(Exception):
    """The model did not return parseable JSON."""


def clean_json_response(content: str):
    """
    Strip markdown fences and surrounding prose, then parse the JSON object.

    Raises InvalidModelJSON on failure so every caller can map it to the same
    status code.
    """

    try:

        content = content.replace("```json", "").replace("```", "").strip()

        match = re.search(r"\{.*\}", content, re.DOTALL)

        if match:
            content = match.group()

        return json.loads(content)

    except Exception as error:

        raise InvalidModelJSON("AI returned invalid JSON") from error
