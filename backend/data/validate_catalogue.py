"""Validate the persisted global plant knowledge catalogue."""

from database.connection import SessionLocal
from database.models.plant_species import PlantSpecies
from database.models.plant_symptom import PlantSymptom


ALLOWED_CATEGORIES = {"indoor_foliage", "succulent", "tropical", "flowering", "herb", "edible", "garden", "other"}
ALLOWED_DIFFICULTIES = {"easy", "moderate", "difficult"}
ALLOWED_LIGHT = {"low_to_medium", "bright_indirect", "bright_direct", "full_sun", "partial_shade"}


def validate_catalogue(session) -> None:
    plants = session.query(PlantSpecies).all()
    assert len(plants) == 40, f"Expected 40 records, found {len(plants)}."
    assert len({plant.scientific_name for plant in plants}) == 40, "Scientific identities are not unique."
    for plant in plants:
        assert plant.common_name and plant.scientific_name and plant.description
        assert plant.category in ALLOWED_CATEGORIES
        assert plant.difficulty in ALLOWED_DIFFICULTIES
        assert plant.light_requirement in ALLOWED_LIGHT
        assert plant.source_references and plant.image_url is None
        _ordered(plant.temperature_min, plant.temperature_ideal_min, plant.temperature_ideal_max, plant.temperature_max)
        _ordered(plant.humidity_min, plant.humidity_ideal_min, plant.humidity_ideal_max, plant.humidity_max)
        _ordered(plant.sunlight_hours_min, plant.sunlight_hours_ideal_min, plant.sunlight_hours_ideal_max, plant.sunlight_hours_max)
        _ordered(plant.watering_frequency_min_days, plant.watering_frequency_max_days)
        _ordered(plant.preferred_moisture_min, plant.preferred_moisture_max)
        _ordered(plant.ph_min, plant.ph_max)


def _ordered(*values) -> None:
    populated = [value for value in values if value is not None]
    assert populated == sorted(populated), f"Invalid ordered range: {values}"


def validate_symptom_knowledge(session) -> None:
    """Verify every catalogue plant has symptom knowledge without duplicates."""
    species_ids = {str(plant.id) for plant in session.query(PlantSpecies).all()}
    assert len(species_ids) == 40, f"Expected 40 species, found {len(species_ids)}."
    symptoms = session.query(PlantSymptom).all()
    seen = set()
    covered = set()
    for symptom in symptoms:
        assert symptom.plant_species_id is not None, "Symptom knowledge must reference a catalogue plant."
        key = (str(symptom.plant_species_id), symptom.symptom_name)
        assert key not in seen, f"Duplicate symptom knowledge: {key}."
        seen.add(key)
        covered.add(str(symptom.plant_species_id))
    assert covered == species_ids, "Every catalogue plant must have symptom knowledge."


def main() -> None:
    session = SessionLocal()
    try:
        validate_catalogue(session)
        print("Plant catalogue validation passed: 40 unique, structurally valid records.")
        validate_symptom_knowledge(session)
        print("Plant symptom validation passed: all 40 species covered, no duplicates.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
