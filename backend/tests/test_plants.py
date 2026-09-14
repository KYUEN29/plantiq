from uuid import uuid4


def seed(session):
    from data.seed_plants import seed_catalogue
    return seed_catalogue(session)


def test_catalogue_seed_is_idempotent_and_complete(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    session = SessionLocal()
    assert seed(session) == (40, 0)
    assert seed(session) == (0, 40)
    plants = session.query(PlantSpecies).all()
    assert len(plants) == 40
    assert len({plant.scientific_name for plant in plants}) == 40
    assert all(plant.source_references for plant in plants)
    session.close()


def test_plant_catalogue_endpoints_and_filters(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    session = SessionLocal()
    seed(session)
    snake = session.query(PlantSpecies).filter_by(scientific_name="Dracaena trifasciata").one()
    session.close()

    listing = client.get("/plants")
    assert listing.status_code == 200
    assert len(listing.json()) == 40
    assert client.get("/plants?category=succulent").status_code == 200
    assert client.get("/plants?search=snake").json()[0]["scientific_name"] == "Dracaena trifasciata"

    detail = client.get(f"/plants/{snake.id}")
    assert detail.status_code == 200
    assert detail.json()["source_references"]
    assert detail.json()["preferred_soil_types"]
    assert client.get(f"/plants/{uuid4()}").status_code == 404


def test_catalogue_controlled_values_and_ranges(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    session = SessionLocal()
    seed(session)
    from data.validate_catalogue import validate_catalogue
    validate_catalogue(session)
    allowed_categories = {"indoor_foliage", "succulent", "tropical", "flowering", "herb", "edible", "garden", "other"}
    allowed_difficulties = {"easy", "moderate", "difficult"}
    allowed_light = {"low_to_medium", "bright_indirect", "bright_direct", "full_sun", "partial_shade"}
    for plant in session.query(PlantSpecies).all():
        assert plant.category in allowed_categories
        assert plant.difficulty in allowed_difficulties
        assert plant.light_requirement in allowed_light
        if plant.temperature_min is not None:
            assert plant.temperature_min <= plant.temperature_ideal_min <= plant.temperature_ideal_max <= plant.temperature_max
        if plant.ph_min is not None:
            assert plant.ph_min <= plant.ph_max
    session.close()
