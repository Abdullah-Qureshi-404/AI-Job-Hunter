"""
=========================================================
Matcher App Services
=========================================================

Handles job matching logic comparing user skills against job requirements.
"""


def match_jobs_for_user(supabase_uid: str, skills: list, jobs):
    """
    Matches user's skills against job title, description, and requirements.

    Formula:
    match_score = (number of matched skills / total skills) * 100

    Returns top 20 results with at least 1 matched skill, sorted highest score first.
    """
    if not skills:
        return []

    normalized_skills = [
        str(s).strip().lower()
        for s in skills
        if str(s).strip()
    ]

    total_skills = len(normalized_skills)
    if total_skills == 0:
        return []

    matched_results = []

    for job in jobs:
        text_to_search = f"{job.title} {job.description} {job.requirements}".lower()

        matched_count = 0
        for skill in normalized_skills:
            if skill in text_to_search:
                matched_count += 1

        if matched_count > 0:
            score = round((matched_count / total_skills) * 100, 2)
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
