"""Evidence-based personalization context (Phase 9).

Pure functions over plain data: no database access, no randomness, no ML
retraining, no LLM calls. A "recurring" pattern requires the same signal in
at least two separate assessments — a single assessment never produces one.
Nothing here modifies plant knowledge; aggregates are counters only.

Language rule: notes describe observed history ("You've reported ..."),
never learning claims ("the model retrained").
"""

RECURRING_THRESHOLD = 2


def issue_codes(result: dict) -> list:
    if not isinstance(result, dict):
        return []
    return sorted({i.get("code") for i in result.get("issues", []) if isinstance(i, dict) and i.get("code")})


def recurring_issues(prior_results: list, min_occurrences: int = RECURRING_THRESHOLD) -> list:
    """Issue codes appearing in at least `min_occurrences` prior assessments."""
    counts: dict = {}
    titles: dict = {}
    for result in prior_results:
        if not isinstance(result, dict):
            continue
        for issue in result.get("issues", []):
            if not isinstance(issue, dict) or not issue.get("code"):
                continue
            counts[issue["code"]] = counts.get(issue["code"], 0) + 1
            titles.setdefault(issue["code"], issue.get("title", issue["code"]))
    return sorted(
        ({"code": code, "title": titles[code], "occurrences": counts[code]}
         for code, count in counts.items() if count >= min_occurrences),
        key=lambda r: (-r["occurrences"], r["code"]),
    )


def feedback_totals(feedbacks: list) -> dict:
    totals = {"helpful": 0, "partially_helpful": 0, "not_helpful": 0}
    for feedback in feedbacks:
        value = feedback.get("helpfulness") if isinstance(feedback, dict) else getattr(feedback, "helpfulness", None)
        if value in totals:
            totals[value] += 1
    return totals


def build_plant_context(nickname: str, prior_results: list, plant_feedbacks: list) -> dict:
    recurring = recurring_issues(prior_results)
    statuses = [r.get("health_status") for r in prior_results
                if isinstance(r, dict) and r.get("health_status")][:3]
    notes = []
    for item in recurring:
        notes.append(
            f"You've reported {item['title'].split('(')[0].strip().lower()} "
            f"for {nickname} before ({item['occurrences']} recent assessments)."
        )
    return {
        "assessment_count": len(prior_results),
        "recurring_issues": recurring,
        "recent_statuses": statuses,
        "feedback": feedback_totals(plant_feedbacks),
        "notes": notes,
    }


def build_user_context(all_results: list, all_feedbacks: list, preferences: dict) -> dict:
    recurring = recurring_issues(all_results)
    notes = []
    for item in recurring[:3]:
        notes.append(
            f"Your recent assessments often report {item['title'].split('(')[0].strip().lower()} "
            f"({item['occurrences']} times)."
        )
    totals = feedback_totals(all_feedbacks)
    if totals["not_helpful"] >= 2:
        notes.append("Several of your recent recommendations were marked not helpful — future guidance will stay closer to your reported conditions.")
    return {
        "total_assessments": len(all_results),
        "recurring_issues": recurring,
        "feedback": totals,
        "preferences": {
            "experience_level": (preferences or {}).get("experience_level"),
            "care_preference": (preferences or {}).get("care_preference"),
        },
        "notes": notes,
    }


def build_context(nickname: str, prior_plant_results: list, plant_feedbacks: list,
                  all_user_results: list, all_user_feedbacks: list, preferences: dict) -> dict:
    """Full personalization context for one plant: plant-specific + user-wide."""
    return {
        "plant": build_plant_context(nickname, prior_plant_results, plant_feedbacks),
        "user": build_user_context(all_user_results, all_user_feedbacks, preferences),
    }
