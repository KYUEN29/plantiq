"""Deterministic recommendation layer (Phase 10).

Sits between the Phase 7 engine and any AI explanation: it enriches frozen
engine findings with priorities, reasons grounded in curated species fields,
and evidence-based personalization. Pure functions — no database, no ML, no
LLM. Same inputs always produce the same output.

Verbosity mapping (documented, content-preserving):
- care_preference "simple": descriptions capped at ~140 chars, evidence omitted.
- "detailed": full description plus supporting evidence lines.
- "balanced"/unset: full description, no evidence dump.
- experience_level "beginner": avoids Latin/slug terms in titles where a plain
  equivalent exists; "experienced": keeps botanical terms.
"""

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}
VALID_SOURCES = ("curated", "personalized", "assessment")
SIMPLE_DESCRIPTION_CHARS = 140


def _species_field(species, name):
    if isinstance(species, dict):
        return species.get(name)
    return getattr(species, name, None)


def _name(species) -> str:
    name = _species_field(species, "common_name")
    return str(name) if name else "This plant"


def _plain_title(title: str, experience: str | None) -> str:
    if experience == "beginner":
        return (title.replace("etiolation", "stretching from low light")
                .replace("chlorosis", "yellowing")
                .replace("senescence", "natural aging"))
    return title


def _describe(text: str, evidence: list, care_preference: str | None) -> str:
    if care_preference == "simple":
        short = text if len(text) <= SIMPLE_DESCRIPTION_CHARS else text[:SIMPLE_DESCRIPTION_CHARS].rsplit(" ", 1)[0] + "…"
        return short
    if care_preference == "detailed" and evidence:
        return text + " Evidence: " + " ".join(evidence)
    return text


def _light_requirement_text(species) -> str:
    requirement = _species_field(species, "light_requirement")
    return str(requirement).replace("_", " ") if requirement else "its preferred light"


def build_guidance(result: dict, species, personalization: dict | None, preferences: dict | None) -> dict:
    """Enrich a frozen engine result into structured, personalized guidance."""
    preferences = preferences or {}
    experience = preferences.get("experience_level")
    care = preferences.get("care_preference")
    plant = _name(species)
    personalization = personalization or {}
    plant_ctx = personalization.get("plant", {}) if isinstance(personalization, dict) else {}
    recurring = {i.get("code") for i in plant_ctx.get("recurring_issues", []) if isinstance(i, dict)}

    recommendations = []

    def add(code, title, description, priority, reason, source, evidence=()):
        if source not in VALID_SOURCES:
            source = "assessment"
        recommendations.append({
            "code": code,
            "title": _plain_title(title, experience),
            "description": _describe(description, list(evidence), care),
            "priority": priority,
            "reason": reason,
            "source": source,
        })

    for dimension in (result or {}).get("dimensions", []):
        if not isinstance(dimension, dict):
            continue
        feature, finding = dimension.get("feature"), dimension.get("finding")
        evidence = dimension.get("evidence", []) or []
        if finding == "concerning" and feature == "watering":
            add("watering:review", "Review watering",
                f"Your assessment suggests {plant} may be stressed by its current moisture. "
                "Let the soil dry to its preferred level before watering again, and make sure excess water can drain away.",
                "high", " ".join(evidence) or dimension.get("detail", ""), "assessment", evidence)
        elif finding in ("below", "above") and feature == "light":
            direction = "brighter spot" if finding == "below" else "protection from the strongest direct sun"
            add("light:adjust", "Adjust light",
                f"Your assessment suggests {plant} would do better in a {direction} "
                f"({plant} prefers {_light_requirement_text(species)}).",
                "medium", " ".join(evidence) or dimension.get("detail", ""), "curated", evidence)
        elif finding == "mild" and feature == "soil":
            preferred = _species_field(species, "preferred_soil_types") or []
            add("soil:repot", "Consider repotting mix",
                f"At the next repot, use one of {plant}'s documented preferred media: "
                f"{', '.join(preferred) or 'a fresh well-draining mix'}.",
                "medium", " ".join(evidence) or dimension.get("detail", ""), "curated", evidence)
        elif finding == "mild" and feature == "growth":
            add("growth:observe", "Observe growth",
                f"The reported stage is atypical for {plant}. Keep watching new growth over the next few weeks.",
                "low", " ".join(evidence) or dimension.get("detail", ""), "assessment", evidence)

    for issue in (result or {}).get("issues", []):
        if not isinstance(issue, dict) or not issue.get("code"):
            continue
        code = issue["code"]
        base_title = issue.get("title", code)
        evidence = issue.get("evidence", []) or []
        personalized = code in recurring
        if personalized:
            title = f"{base_title} (seen before)"
            reason = " ".join(evidence) + " You have reported this for this plant before."
            source = "personalized"
        else:
            title, reason, source = base_title, " ".join(evidence), "curated"
        add(f"issue:{code}", title,
            f"Possible issue for {plant}: {base_title.split('(')[0].strip().lower()}. "
            "Monitor closely and re-assess in a few days; isolate from other plants if pests are suspected.",
            "high" if issue.get("severity") == "concern" else "medium",
            reason or base_title, source, evidence)

    recommendations.sort(key=lambda r: (PRIORITY_ORDER.get(r["priority"], 1), r["code"]))
    notes = list((personalization.get("plant", {}) or {}).get("notes", [])) if isinstance(personalization, dict) else []
    notes += list((personalization.get("user", {}) or {}).get("notes", [])) if isinstance(personalization, dict) else []

    return {
        "recommendations": recommendations,
        "personalization_notes": sorted(set(notes)),
        "limitations": list((result or {}).get("limitations", [])),
    }
