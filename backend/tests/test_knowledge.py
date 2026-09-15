from uuid import uuid4


ML_SPECIES = [
    "Epipremnum aureum",
    "Dracaena trifasciata",
    "Ocimum basilicum",
    "Monstera deliciosa",
    "Aloe vera",
    "Spathiphyllum spp.",
    "Chlorophytum comosum",
    "Dypsis lutescens",
    "Nephrolepis exaltata",
    "Crassula ovata",
]

EXTRA_SPECIES = [
    "Zamioculcas zamiifolia",
    "Rosa spp.",
    "Solanum lycopersicum",
]


def seed(session):
    from data.seed_symptoms import seed_symptoms
    return seed_symptoms(session)


def test_all_40_species_have_symptom_knowledge_without_duplicates(client):
    from data.plant_catalogue import PLANT_CATALOGUE
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies
    from database.models.plant_symptom import PlantSymptom

    session = SessionLocal()
    seed(session)
    species = session.query(PlantSpecies).all()
    assert len(species) == 40

    symptoms = session.query(PlantSymptom).all()
    expected = sum(len(p.get("common_problems") or []) for p in PLANT_CATALOGUE)
    assert len(symptoms) == expected

    seen = set()
    for symptom in symptoms:
        key = (str(symptom.plant_species_id), symptom.symptom_name)
        assert key not in seen
        seen.add(key)

    counts = {}
    for symptom in symptoms:
        counts[str(symptom.plant_species_id)] = counts.get(str(symptom.plant_species_id), 0) + 1
    assert len(counts) == 40
    assert all(count >= 1 for count in counts.values())

    from data.validate_catalogue import validate_catalogue, validate_symptom_knowledge
    validate_catalogue(session)
    validate_symptom_knowledge(session)
    session.close()


def test_symptom_seed_is_idempotent(client):
    from database.connection import SessionLocal
    from database.models.plant_symptom import PlantSymptom

    session = SessionLocal()
    first = seed(session)
    second = seed(session)
    assert first[0] > 0
    assert second == (0, first[0] + first[1])
    assert session.query(PlantSymptom).count() == first[0] + first[1]
    session.close()


def test_original_10_ml_species_keep_symptom_knowledge(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    session = SessionLocal()
    seed(session)
    for scientific in ML_SPECIES:
        species = session.query(PlantSpecies).filter_by(scientific_name=scientific).one()
        detail = client.get(f"/plants/{species.id}/symptoms")
        assert detail.status_code == 200
        assert len(detail.json()) >= 1
    session.close()


def test_additional_30_species_symptoms_retrievable(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    session = SessionLocal()
    seed(session)
    for scientific in EXTRA_SPECIES:
        assert scientific not in ML_SPECIES
        species = session.query(PlantSpecies).filter_by(scientific_name=scientific).one()
        detail = client.get(f"/plants/{species.id}/symptoms")
        assert detail.status_code == 200
        body = detail.json()
        assert len(body) >= 1
        assert all(item["plant_species_id"] == str(species.id) for item in body)
    assert client.get(f"/plants/{uuid4()}/symptoms").status_code == 404
    session.close()


def test_catalogue_endpoints_expose_full_knowledge_for_40(client):
    from database.connection import SessionLocal

    session = SessionLocal()
    seed(session)
    session.close()

    listing = client.get("/plants")
    assert listing.status_code == 200
    plants = listing.json()
    assert len(plants) == 40
    sample = plants[0]
    for field in (
        "moisture_retention", "growth_stages", "growth_rate",
        "fertilizer_type", "fertilizer_frequency", "seasonal_care",
        "repotting_interval", "common_problems", "care_guidelines",
        "source_references",
    ):
        assert field in sample, f"Missing knowledge field: {field}"


def test_non_ml_species_still_blocked_from_quantitative_prediction(client):
    response = client.post("/predict", json={"plants": [{
        "name": "Tomato", "water": "Properly watered", "sunlight": "Partial shade",
        "color": "Healthy green", "soil": "Moist",
    }]})
    assert response.status_code == 400
    assert "not yet available" in response.json()["detail"]
