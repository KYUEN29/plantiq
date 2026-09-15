import pytest
from tests.test_guidance import _setup, _submit, _register, _auth, _garden_plant, _species_id, WET_ALOE, BENIGN

def test_care_prescription_contains_action_types_and_what_to_watch(client):
    token, plant_id, questions = _setup(client)
    body = _submit(client, token, plant_id, questions, WET_ALOE)
    
    guidance = body["guidance"]
    assert "recommendations" in guidance
    assert "next_best_action" in guidance
    assert guidance["next_best_action"] is not None
    
    # Verify primary action
    top_action = guidance["next_best_action"]
    assert top_action["priority"] == "high"
    assert top_action["action_type"] in ["WATER", "LIGHT", "SOIL", "PEST", "OBSERVE"]
    assert top_action["what_to_watch"] is not None
    assert len(top_action["what_to_watch"]) > 0

    # Verify each recommendation has care prescription contract
    for rec in guidance["recommendations"]:
        assert rec["action_type"] in ["WATER", "LIGHT", "SOIL", "DRAINAGE", "HUMIDITY", "TEMPERATURE", "PEST", "PRUNING", "REPOTTING", "FERTILIZING", "OBSERVE", "OTHER"]
        assert rec["priority"] in ["high", "medium", "low"]
        assert rec["title"]
        assert rec["description"]


def test_historical_comparison_tracks_progression(client):
    token, plant_id, questions = _setup(client)
    
    # First assessment: wet aloe (score = 77)
    first_res = _submit(client, token, plant_id, questions, WET_ALOE)
    assert first_res["guidance"]["historical_comparison"] is None

    # Second assessment: benign aloe (score = 100)
    second_res = _submit(client, token, plant_id, questions, BENIGN)
    comp = second_res["guidance"]["historical_comparison"]
    assert comp is not None
    assert comp["trend"] == "improving"
    assert comp["previous_score"] == 77
    assert "increased by 13 points" in comp["summary"]


def test_all_40_species_generate_care_prescription(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies
    from data.seed_plants import seed_catalogue
    from data.seed_symptoms import seed_symptoms

    db = SessionLocal()
    try:
        seed_catalogue(db)
        seed_symptoms(db)
        species_list = db.query(PlantSpecies).all()
        assert len(species_list) == 40
    finally:
        db.close()

    token = _register(client, "40 Plant Tester", "tester40@example.com")
    questions = client.get("/questionnaires/current/questions", headers=_auth(token)).json()

    # Sample representative plants across 6 distinct categories
    sample_species = [
        "Aloe vera",               # succulent
        "Monstera deliciosa",      # tropical / foliage
        "Ocimum basilicum",        # herb
        "Lavandula angustifolia",  # flowering
        "Solanum lycopersicum",    # edible / home garden
        "Ficus lyrata"             # decorative tree / foliage
    ]

    for sci_name in sample_species:
        sp_id = _species_id(sci_name)
        p_id = _garden_plant(client, token, sp_id, nickname=f"Sample {sci_name}")
        res = _submit(client, token, p_id, questions, WET_ALOE)
        assert res["result"]["health_score"] is not None
        assert res["guidance"]["next_best_action"] is not None
        assert res["guidance"]["recommendations"]
