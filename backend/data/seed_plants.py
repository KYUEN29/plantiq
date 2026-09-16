"""Idempotently seed the global Plantiq plant knowledge catalogue.

Run from ``backend`` after migrations: ``python -m data.seed_plants``.
"""

from database.connection import SessionLocal
from database.models.plant_species import PlantSpecies
from data.plant_catalogue import PLANT_CATALOGUE


def seed_catalogue(session) -> tuple[int, int]:
    """Idempotently seed the global plant catalogue.

    This function creates any missing PlantSpecies records and updates existing
    ones without changing the logical ordering of the catalogue.
    """
    created = updated = 0
    for values in PLANT_CATALOGUE:
        existing = session.query(PlantSpecies).filter_by(scientific_name=values["scientific_name"]).one_or_none()
        if existing is None:
            session.add(PlantSpecies(**values))
            created += 1
        else:
            for key, value in values.items():
                setattr(existing, key, value)
            updated += 1
    session.commit()
    return created, updated


def main() -> None:
    session = SessionLocal()
    try:
        created, updated = seed_catalogue(session)
        print(f"Plant catalogue seeded: {created} created, {updated} updated.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
