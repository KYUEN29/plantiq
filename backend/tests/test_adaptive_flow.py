from uuid import uuid4
import database.models  # Ensure all ORM models are registered
from database.models.plant_species import PlantSpecies
from database.models.user_plant import UserPlant
from database.models.assessment import Assessment
from services.question_engine import QuestionEngine
from data.seed_plants import seed_catalogue

def test_question_engine_core_progression(client):
    from database.connection import SessionLocal
    db = SessionLocal()
    try:
        seed_catalogue(db)
        species = db.query(PlantSpecies).first()
        plant = UserPlant(
            id=uuid4(),
            user_id=uuid4(),
            plant_species_id=species.id,
            nickname="Test Specimen"
        )
        db.add(plant)
        db.flush()

        assessment = Assessment(
            id=uuid4(),
            user_plant_id=plant.id,
            status="in_progress"
        )
        db.add(assessment)
        db.flush()

        engine = QuestionEngine(db)
        first_q = engine.get_next_question(plant, assessment)
        assert first_q is not None
        assert first_q.question_order is not None
    finally:
        db.close()


def test_adaptive_api_endpoints_flow(client):
    from database.connection import SessionLocal
    db = SessionLocal()
    try:
        seed_catalogue(db)
    finally:
        db.close()

    # Register & login user
    reg = client.post(
        "/auth/register",
        json={"email": "adaptive@example.com", "password": "StrongPassword123!", "name": "Adaptive User"},
    )
    assert reg.status_code == 201

    # Get species (returns a list directly)
    species_res = client.get("/plants")
    assert species_res.status_code == 200
    plants = species_res.json()
    assert len(plants) > 0
    species_id = plants[0]["id"]

    # Add plant to garden
    plant_res = client.post(
        "/garden",
        json={"plant_species_id": species_id, "nickname": "Adaptive Aloe"},
    )
    assert plant_res.status_code == 201
    plant_id = plant_res.json()["id"]

    # 1. Fetch next question
    next_q_res = client.get(f"/assessments/{plant_id}/next-question")
    assert next_q_res.status_code == 200
    data = next_q_res.json()
    assert "question" in data
    assert data["question"] is not None
    q_id = data["question"]["id"]

    # 2. Submit answer
    ans_res = client.post(
        f"/assessments/{plant_id}/answers",
        json={"question_id": q_id, "value": "test_value", "finalize": False},
    )
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert "progress" in ans_data
    assert ans_data["progress"] >= 1
