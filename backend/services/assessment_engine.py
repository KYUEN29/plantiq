"""Deterministic, explainable plant-health assessment engine (Phase 7).

Compares normalized questionnaire answers against the curated ``plant_species``
record and its ``plant_symptoms`` rows. Pure functions of
(species fields, symptom names, answers): no database access, no randomness,
no clock, no ML model, no LLM. Same inputs always produce the same result.

Dimensions the current data genuinely supports:
- watering: reported moisture vs ``moisture_retention`` + ``drought_tolerance``
  / ``overwatering_sensitivity`` flags, plus routine/last-watered cross-checks.
- light: reported light level vs ``light_requirement`` on a documented ordinal.
- soil: reported soil vs ``preferred_soil_types`` through a documented mapping.
- growth: reported stage vs ``growth_stages`` membership.
- symptoms: reported symptoms vs seeded per-species ``plant_symptoms`` names.

Dimensions the data does NOT support (reported as ``insufficient`` and never
scored): temperature and humidity (catalogue ranges are deliberately NULL),
pot size (``preferred_pot_size`` is NULL), and absolute watering schedules
(catalogue frequencies are deliberately NULL).

Scoring (documented weights, clamped to 0-100):
- start at 100
- concerning finding: -15
- mild/atypical finding: -5
- reported symptom matching species knowledge: -10 each
- generally serious sign (pests, white residue, wilting) without species
  knowledge: -8 each
- other observed-but-unknown symptom: -3 each (``healthy``/``other``: 0)
- symptom deductions capped at -30 so one dimension cannot dominate
- status: >=80 Healthy, 50-79 Needs attention, <50 Critical
- confidence: High when every evaluated dimension had usable answers,
  otherwise Moderate, with each gap listed under ``limitations``.
"""

LIGHT_LEVELS = {"low": 0, "indirect": 1, "bright_indirect": 2, "direct": 3}
REQUIREMENT_LEVELS = {
    "low_to_medium": 1,
    "bright_indirect": 2,
    "partial_shade": 2,
    "bright_direct": 3,
    "full_sun": 3,
}
MOISTURE_LEVELS = {"very_dry": 0, "slightly_dry": 1, "moist": 2, "very_moist": 3, "waterlogged": 4}
RETENTION_LEVELS = {"low": 1, "moderate": 2, "high": 3}

# Questionnaire soil values -> catalogue preferred_soil_types concepts.
SOIL_MAP = {
    "regular_potting": "standard_potting_mix",
    "well_draining_mix": "well_draining",
    "succulent_cactus_mix": "cactus_succulent_mix",
    "garden_soil": "loamy",
    "cocopeat_coir": "moisture_retentive",
}

# Serious signs even when absent from a species' curated symptom list.
SERIOUS_SIGNS = {"pests", "white_residue", "wilting"}

CONCERNING_DEDUCTION = 15
MILD_DEDUCTION = 5
KNOWN_SYMPTOM_DEDUCTION = 10
SERIOUS_SIGN_DEDUCTION = 8
UNKNOWN_SYMPTOM_DEDUCTION = 3
SYMPTOM_DEDUCTION_CAP = 30

HEALTHY_THRESHOLD = 80
ATTENTION_THRESHOLD = 50


def status_for_score(score: int) -> str:
    """Single source of truth mapping a score to its status category."""
    if score >= HEALTHY_THRESHOLD:
        return "Healthy"
    if score >= ATTENTION_THRESHOLD:
        return "Needs attention"
    return "Critical"


def _species_field(species, name):
    if isinstance(species, dict):
        return species.get(name)
    return getattr(species, name, None)


def _symptom_names(symptoms) -> set:
    names = set()
    for symptom in symptoms:
        name = symptom.get("symptom_name") if isinstance(symptom, dict) else getattr(symptom, "symptom_name", None)
        if name:
            names.add(str(name).strip().lower())
    return names


def evaluate_watering(feature_map: dict, species) -> dict:
    moisture = feature_map.get("moisture")
    retention = _species_field(species, "moisture_retention")
    drought = _species_field(species, "drought_tolerance")
    overwatering = _species_field(species, "overwatering_sensitivity")
    routine = feature_map.get("watering_frequency")
    last_watered = feature_map.get("time_since_last_water")
    evidence = []

    if moisture in (None, "unknown"):
        return {"feature": "watering", "finding": "insufficient",
                "detail": "Soil moisture was not reported.", "evidence": evidence, "deduction": 0}

    level = MOISTURE_LEVELS.get(moisture)
    expected = RETENTION_LEVELS.get((retention or "").lower()) if retention else None

    if moisture == "waterlogged" and (overwatering or "").lower() == "high":
        evidence.append(f"Soil is waterlogged and {name_of(species)} is highly sensitive to overwatering.")
        return {"feature": "watering", "finding": "concerning",
                "detail": "Possible overwatering-related stress.", "evidence": evidence,
                "deduction": CONCERNING_DEDUCTION}
    if moisture == "very_dry" and (drought or "").lower() == "low":
        evidence.append(f"Soil is very dry and {name_of(species)} has low drought tolerance.")
        return {"feature": "watering", "finding": "concerning",
                "detail": "Possible underwatering-related stress.", "evidence": evidence,
                "deduction": CONCERNING_DEDUCTION}
    if level is not None and expected is not None:
        if abs(level - expected) <= 1:
            detail = "Soil moisture is within the expected range."
            finding, deduction = "within", 0
        elif level > expected:
            detail = "Soil moisture is above the expected range."
            finding, deduction = "above", MILD_DEDUCTION
        else:
            detail = "Soil moisture is below the expected range."
            finding, deduction = "below", MILD_DEDUCTION
        evidence.append(f"Reported {moisture.replace('_', ' ')}; {name_of(species)} prefers {retention} moisture retention.")
    else:
        detail = "Soil moisture reported; no comparable retention knowledge."
        finding, deduction = "within", 0

    if routine == "daily" and (overwatering or "").lower() == "high":
        evidence.append("Daily watering with high overwatering sensitivity.")
        finding, deduction = "above", max(deduction, MILD_DEDUCTION)
        detail = "Watering routine looks more frequent than this plant prefers."
    if last_watered == "over_week" and (drought or "").lower() == "low":
        evidence.append("Not watered for over a week with low drought tolerance.")
        finding, deduction = "below", max(deduction, MILD_DEDUCTION)
        detail = "Time since watering looks longer than this plant prefers."
    return {"feature": "watering", "finding": finding, "detail": detail,
            "evidence": evidence, "deduction": deduction}


def evaluate_light(feature_map: dict, species) -> dict:
    light = feature_map.get("light")
    requirement = _species_field(species, "light_requirement")
    evidence = []
    if light in (None, "unknown", "mixed") or not requirement:
        return {"feature": "light", "finding": "insufficient",
                "detail": "Light conditions could not be compared.", "evidence": evidence, "deduction": 0}
    reported = LIGHT_LEVELS.get(light)
    expected = REQUIREMENT_LEVELS.get(str(requirement).lower())
    if reported is None or expected is None:
        return {"feature": "light", "finding": "insufficient",
                "detail": "Light conditions could not be compared.", "evidence": evidence, "deduction": 0}
    evidence.append(f"Reported {light.replace('_', ' ')}; {name_of(species)} prefers {requirement.replace('_', ' ')}.")
    if reported == expected:
        return {"feature": "light", "finding": "within", "detail": "Light matches this plant's requirement.",
                "evidence": evidence, "deduction": 0}
    if reported < expected:
        return {"feature": "light", "finding": "below", "detail": "Light looks lower than this plant prefers.",
                "evidence": evidence, "deduction": MILD_DEDUCTION}
    return {"feature": "light", "finding": "above", "detail": "Light looks stronger than this plant prefers.",
            "evidence": evidence, "deduction": MILD_DEDUCTION}


def evaluate_soil(feature_map: dict, species) -> dict:
    soil = feature_map.get("soil_type")
    preferred = _species_field(species, "preferred_soil_types") or []
    evidence = []
    if soil in (None, "unknown", "other"):
        return {"feature": "soil", "finding": "insufficient",
                "detail": "Soil type was not specified.", "evidence": evidence, "deduction": 0}
    concept = SOIL_MAP.get(soil)
    if concept is None:
        return {"feature": "soil", "finding": "insufficient",
                "detail": "Soil type was not specified.", "evidence": evidence, "deduction": 0}
    if concept in list(preferred):
        evidence.append(f"Reported soil maps to {concept}, one of this plant's preferred media.")
        return {"feature": "soil", "finding": "within", "detail": "Soil suits this plant's preferred media.",
                "evidence": evidence, "deduction": 0}
    evidence.append(f"Reported soil maps to {concept}; preferred media: {', '.join(preferred) or 'not curated'}.")
    return {"feature": "soil", "finding": "mild", "detail": "Soil differs from this plant's preferred media.",
            "evidence": evidence, "deduction": MILD_DEDUCTION}


def evaluate_growth(feature_map: dict, species) -> dict:
    stage = feature_map.get("growth_stage")
    stages = _species_field(species, "growth_stages") or []
    evidence = []
    if stage in (None, "unknown"):
        return {"feature": "growth", "finding": "insufficient",
                "detail": "Growth stage was not reported.", "evidence": evidence, "deduction": 0}
    if stage in list(stages):
        return {"feature": "growth", "finding": "within",
                "detail": f"Reported stage fits this plant's known stages ({', '.join(stages)}).",
                "evidence": evidence, "deduction": 0}
    evidence.append(f"Reported {stage}; known stages: {', '.join(stages) or 'not curated'}.")
    return {"feature": "growth", "finding": "mild", "detail": "Reported stage is atypical for this plant.",
            "evidence": evidence, "deduction": MILD_DEDUCTION}


def evaluate_environment(feature_map: dict) -> dict:
    """Temperature/humidity have no curated ranges by design: never scored."""
    gaps = []
    if feature_map.get("temperature") in (None, "unknown"):
        gaps.append("temperature was not reported")
    if feature_map.get("humidity") in (None, "unknown"):
        gaps.append("humidity was not reported")
    if gaps:
        return {"feature": "environment", "finding": "insufficient",
                "detail": "Temperature and humidity have no curated reference ranges; " + " and ".join(gaps) + ".",
                "evidence": [], "deduction": 0}
    return {"feature": "environment", "finding": "insufficient",
            "detail": "Temperature and humidity are recorded but have no curated reference ranges to compare against.",
            "evidence": [], "deduction": 0}


def evaluate_pot(feature_map: dict) -> dict:
    if feature_map.get("pot_size") in (None, "unknown"):
        return {"feature": "pot", "finding": "insufficient",
                "detail": "Pot size was not reported and no preferred size is curated.",
                "evidence": [], "deduction": 0}
    return {"feature": "pot", "finding": "insufficient",
            "detail": "Pot size is recorded but no preferred size is curated for comparison.",
            "evidence": [], "deduction": 0}


def evaluate_symptoms(feature_map: dict, species, symptoms) -> tuple:
    reported = feature_map.get("symptoms") or []
    if not isinstance(reported, list):
        reported = [reported]
    reported = [str(v) for v in reported if v]
    known = _symptom_names(symptoms)
    issues = []
    deduction = 0

    def label(value: str) -> str:
        return value.replace("_", " ").capitalize()

    if not reported or reported == ["healthy"]:
        return ({"feature": "symptoms", "finding": "within",
                 "detail": "No concerning symptoms reported.", "evidence": [], "deduction": 0},
                issues, deduction)

    for value in sorted(set(reported)):
        if value in ("healthy", "other"):
            continue
        if value.lower().replace(" ", "_") in {n.replace(" ", "_") for n in known} or label(value).lower() in known:
            issues.append({
                "code": f"known:{value}",
                "title": f"Possible {label(value).lower()} ({name_of(species)} is known to develop this)",
                "severity": "concern",
                "evidence": [f"User reported {label(value).lower()}; present in this plant's curated symptom knowledge."],
            })
            deduction += KNOWN_SYMPTOM_DEDUCTION
        elif value in SERIOUS_SIGNS:
            issues.append({
                "code": f"serious:{value}",
                "title": f"Possible {label(value).lower()} (generally serious sign)",
                "severity": "concern",
                "evidence": [f"User reported {label(value).lower()}; not in this plant's curated list but a generally serious sign."],
            })
            deduction += SERIOUS_SIGN_DEDUCTION
        else:
            issues.append({
                "code": f"observed:{value}",
                "title": f"Observed {label(value).lower()} (not in curated knowledge for this plant)",
                "severity": "mild",
                "evidence": [f"User reported {label(value).lower()}; recorded as context for future reasoning."],
            })
            deduction += UNKNOWN_SYMPTOM_DEDUCTION

    deduction = min(deduction, SYMPTOM_DEDUCTION_CAP)
    finding = "concerning" if any(i["severity"] == "concern" for i in issues) else "mild"
    detail = "Reported symptoms match this plant's known problems." if finding == "concerning" else "Reported symptoms recorded as context."
    return ({"feature": "symptoms", "finding": finding, "detail": detail,
             "evidence": [i["title"] for i in issues], "deduction": deduction},
            sorted(issues, key=lambda i: i["code"]), deduction)


def name_of(species) -> str:
    name = _species_field(species, "common_name")
    return str(name) if name else "This plant"


def build_recommendations(dimensions: list, issues: list, species) -> list:
    recommendations = []
    plant = name_of(species)
    for dimension in dimensions:
        finding = dimension.get("finding")
        feature = dimension.get("feature")
        if finding == "concerning" and feature == "watering":
            recommendations.append({
                "issue_code": None,
                "text": f"Let the soil dry to {plant}'s preferred level before watering again, and ensure the pot drains freely.",
                "source": "curated",
            })
        elif finding in ("below",) and feature == "light":
            recommendations.append({
                "issue_code": None,
                "text": f"Move {plant} to a brighter spot matching its preferred light ({_species_field(species, 'light_requirement')}).",
                "source": "curated",
            })
        elif finding == "above" and feature == "light":
            recommendations.append({
                "issue_code": None,
                "text": f"Shield {plant} from the strongest direct sun and acclimate it gradually to brighter positions.",
                "source": "curated",
            })
        elif finding == "mild" and feature == "soil":
            preferred = _species_field(species, "preferred_soil_types") or []
            recommendations.append({
                "issue_code": None,
                "text": f"At the next repot, use one of {plant}'s preferred media: {', '.join(preferred) or 'a fresh well-draining mix'}.",
                "source": "curated",
            })
    for issue in issues:
        if issue["severity"] == "concern":
            recommendations.append({
                "issue_code": issue["code"],
                "text": f"Monitor the reported {issue['title'].split('(')[0].strip().lower()} closely; isolate from other plants if pests are suspected and re-assess in a few days.",
                "source": "curated",
            })
    seen = set()
    unique = []
    for recommendation in recommendations:
        if recommendation["text"] not in seen:
            seen.add(recommendation["text"])
            unique.append(recommendation)
    return unique


def evaluate(species, symptoms, feature_map: dict) -> dict:
    """Run the full deterministic evaluation. Returns the structured result."""
    water_dim = evaluate_watering(feature_map, species)
    light_dim = evaluate_light(feature_map, species)
    soil_dim = evaluate_soil(feature_map, species)
    growth_dim = evaluate_growth(feature_map, species)
    env_dim = evaluate_environment(feature_map)
    pot_dim = evaluate_pot(feature_map)
    symptom_dim, issues, _ = evaluate_symptoms(feature_map, species, symptoms)

    dimensions = [water_dim, light_dim, soil_dim, growth_dim, symptom_dim, env_dim, pot_dim]
    total_deduction = sum(d.get("deduction", 0) for d in dimensions)
    score = max(0, min(100, 100 - total_deduction))
    status = status_for_score(score)

    limitations = []
    for dimension in dimensions:
        if dimension.get("finding") == "insufficient":
            limitations.append(f"{dimension['feature']}: {dimension['detail']}")
    unknown_answers = sorted(f for f, v in feature_map.items() if v == "unknown" or v == ["unknown"])
    for feature in unknown_answers:
        limitations.append(f"{feature}: answered 'not sure', excluded from scoring.")
    limitations = sorted(set(limitations))

    return {
        "health_score": score,
        "health_status": status,
        # Confidence reflects answer completeness, not structural data gaps:
        # every required question is answered, so 'unknown' answers are the
        # only thing that can lower it. Missing reference ranges stay visible
        # under limitations instead.
        "confidence": "High" if not unknown_answers else "Moderate",
        "completeness": 1.0,
        "dimensions": dimensions,
        "issues": issues,
        "recommendations": build_recommendations(dimensions, issues, species),
        "limitations": limitations,
        "quantitative_ml": {
            "predicted": False,
            "reason": "Quantitative ML prediction is limited to 10 species and is not run in this phase.",
        },
    }
