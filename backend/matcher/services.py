"""
=========================================================
Matcher App Services
=========================================================

Handles job matching logic comparing user skills against job requirements.
"""

import re


# A profile with very few listed skills should not be able to reach 100%
# just because both of its skills happen to appear somewhere in a job post.
# With 2 skills, matched/total is a step function over {0%, 50%, 100%} - any
# single coincidental match already saturates it. This scales the score down
# until the profile has enough skills for the ratio to mean something.
FULL_CONFIDENCE_SKILL_COUNT = 6


def _compile_skill_pattern(skill: str):
    """
    Whole-word, case-insensitive pattern for a skill.

    Plain substring matching (`skill in text`) matches "ai" inside "email",
    "domain", "maintain", "certain" - and "go" inside almost anything. Word
    boundaries stop that. Skills containing non-word characters (C++, C#,
    Node.js) still match literally, just without \\b on the punctuation side.
    """

    escaped = re.escape(skill.strip())

    prefix = r"\b" if skill[:1].isalnum() else ""
    suffix = r"\b" if skill[-1:].isalnum() else ""

    return re.compile(prefix + escaped + suffix, re.IGNORECASE)


def match_jobs_for_user(supabase_uid: str, skills: list, jobs):
    """
    Matches user's skills against job title, description, and requirements.

    match_score = (matched / total_skills) * confidence * 100, where
    confidence rises from 0 toward 1 as the profile lists more skills. This
    keeps the score meaningful instead of jumping straight to 100% on a
    profile with only one or two entries.

    Returns up to 20 results with at least 1 matched skill, sorted highest
    score first.
    """
    if not skills:
        return []

    normalized_skills = [
        str(s).strip()
        for s in skills
        if str(s).strip()
    ]

    total_skills = len(normalized_skills)
    if total_skills == 0:
        return []

    patterns = [_compile_skill_pattern(skill) for skill in normalized_skills]
    confidence = min(1.0, total_skills / FULL_CONFIDENCE_SKILL_COUNT)

    matched_results = []

    for job in jobs:
        text_to_search = f"{job.title} {job.description} {job.requirements}"

        matched_count = sum(1 for pattern in patterns if pattern.search(text_to_search))

        if matched_count > 0:
            raw_ratio = matched_count / total_skills
            score = round(raw_ratio * confidence * 100, 2)
            matched_results.append({
                "job": job,
                "match_score": score,
            })

    # Sort by match_score descending
    matched_results.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    # Return top 20 results
    return matched_results[:20]
