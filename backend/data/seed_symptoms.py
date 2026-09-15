"""Idempotently seed per-species symptom knowledge for all catalogue plants.

Source of truth remains ``data/plant_catalogue.py``: each catalogue record's
``common_problems`` issues become ``plant_symptoms`` rows linked to the seeded
``plant_species`` row. No facts are invented — slugs are only humanized for
display (``root_rot`` → ``Root rot``) and fields without a curated source stay
NULL. Severity, causes, and actions are intentionally left for future curation.

Run from ``backend`` after seeding the catalogue: ``python -m data.seed_symptoms``.
"""

from data.plant_catalogue import PLANT_CATALOGUE
from data.seed_plants import seed_catalogue
from database.connection import SessionLocal
from database.models.plant_species import PlantSpecies
from database.models.plant_symptom import PlantSymptom


def humanize_issue(slug: str) -> str:
    return slug.replace("_", " ").capitalize()


def seed_symptoms(session) -> tuple[int, int]:
    """Ensure one PlantSymptom row per (species, catalogue issue)."""
    seed_catalogue(session)
    created = updated = 0
    for values in PLANT_CATALOGUE:
        species = session.query(PlantSpecies).filter_by(scientific_name=values["scientific_name"]).one()
        for problem in values.get("common_problems") or []:
            issue = problem.get("issue") if isinstance(problem, dict) else problem
            if not issue:
                continue
            name = humanize_issue(str(issue))
            existing = (
                session.query(PlantSymptom)
                .filter_by(plant_species_id=species.id, symptom_name=name)
                .one_or_none()
            )
            description = (
                f"Commonly reported issue for {values['common_name']} "
                f"({values['scientific_name']}) in the curated Plantiq catalogue."
            )
            if existing is None:
                session.add(
                    PlantSymptom(
                        plant_species_id=species.id,
                        symptom_name=name,
                        description=description,
                    )
                )
                created += 1
            else:
                existing.description = description
                updated += 1
    session.commit()
    return created, updated


def main() -> None:
    session = SessionLocal()
    try:
        created, updated = seed_symptoms(session)
        print(f"Plant symptoms seeded: {created} created, {updated} updated.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
