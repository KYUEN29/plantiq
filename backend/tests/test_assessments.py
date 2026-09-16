from uuid import uuid4


def _register(client, name, email):
    response = client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": "correct-horse-battery-staple",
    })
    assert response.status_code == 201
    return response.cookies.get("access_token")


def _seed_species_id():
    from data.seed_plants import seed_catalogue
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    session = SessionLocal()
    seed_catalogue(session)
    species_id = session.query(PlantSpecies).filter_by(scientific_name="Dracaena trifasciata").one().id
    session.close()
    return species_id


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _garden_plant(client, token, species_id):
    response = client.post("/garden", headers=_auth(token), json={
        "plant_species_id": str(species_id),
        "nickname": "Assess me",
    })
    assert response.status_code == 201
    return response.json()["id"]


def _questions(client, token):
    response = client.get("/questionnaires/current/questions", headers=_auth(token))
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 11
    return questions


def _valid_answers(questions):
    answers = []
    for q in questions:
        answers.append({"question_id": q["id"], "value": q["options"][0]["value"]})
    return answers


def test_authenticated_user_can_retrieve_questions(client):
    species_id = _seed_species_id()
    assert species_id is not None
    token = _register(client, "Assess Owner", "assess-owner@example.com")
    client.cookies.clear()
    questions = _questions(client, token)
    features = {q["maps_to_feature"] for q in questions}
    for expected in (
        "time_since_last_water", "watering_frequency", "moisture",
        "sunlight_hours", "light", "soil_type", "pot_size",
        "growth_stage", "temperature", "humidity", "symptoms",
    ):
        assert expected in features


def test_unauthenticated_user_cannot_submit_assessment(client):
    species_id = _seed_species_id()
    token = _register(client, "Assess Owner", "assess-owner@example.com")
    plant_id = _garden_plant(client, token, species_id)
    client.cookies.clear()
    questions = _questions(client, token)
    client.cookies.clear()
    response = client.post("/assessments", json={
        "user_plant_id": plant_id,
        "answers": _valid_answers(questions),
    })
    assert response.status_code == 401


def test_authenticated_user_can_submit_valid_assessment(client):
    from database.connection import SessionLocal
    from database.models.assessment_answer import AssessmentAnswer
    from database.models.assessment import Assessment

    species_id = _seed_species_id()
    token = _register(client, "Assess Owner", "assess-owner@example.com")
    plant_id = _garden_plant(client, token, species_id)
    questions = _questions(client, token)

    response = client.post("/assessments", headers=_auth(token), json={
        "user_plant_id": plant_id,
        "answers": _valid_answers(questions),
    })
    assert response.status_code == 201
    body = response.json()
    assert body["user_plant_id"] == plant_id
    assert len(body["answers"]) == 11

    session = SessionLocal()
    try:
        assert session.query(Assessment).filter_by(id=body["id"]).one_or_none() is not None
        stored = session.query(AssessmentAnswer).filter_by(assessment_id=body["id"]).all()
        assert len(stored) == 11
    finally:
        session.close()

    fetched = client.get(f"/assessments/{body['id']}", headers=_auth(token))
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


def test_required_questions_are_enforced(client):
    species_id = _seed_species_id()
    token = _register(client, "Assess Owner", "assess-owner@example.com")
    plant_id = _garden_plant(client, token, species_id)
    questions = _questions(client, token)
    partial = _valid_answers(questions)[:-1]
    response = client.post("/assessments", headers=_auth(token), json={
        "user_plant_id": plant_id,
        "answers": partial,
    })
    assert response.status_code == 422


def test_invalid_option_is_rejected(client):
    species_id = _seed_species_id()
    token = _register(client, "Assess Owner", "assess-owner@example.com")
    plant_id = _garden_plant(client, token, species_id)
    questions = _questions(client, token)
    answers = _valid_answers(questions)
    answers[0] = {"question_id": answers[0]["question_id"], "value": "not-a-real-option"}
    response = client.post("/assessments", headers=_auth(token), json={
        "user_plant_id": plant_id,
        "answers": answers,
    })
    assert response.status_code == 422


def test_nonexistent_plant_is_rejected(client):
    token = _register(client, "Assess Owner", "assess-owner@example.com")
    questions = _questions(client, token)
    response = client.post("/assessments", headers=_auth(token), json={
        "user_plant_id": str(uuid4()),
        "answers": _valid_answers(questions),
    })
    assert response.status_code == 404


def test_user_cannot_assess_another_users_plant(client):
    species_id = _seed_species_id()
    owner_token = _register(client, "Assess Owner", "assess-owner@example.com")
    other_token = _register(client, "Other User", "other@example.com")
    client.cookies.clear()
    plant_id = _garden_plant(client, owner_token, species_id)
    questions = _questions(client, other_token)
    response = client.post("/assessments", headers=_auth(other_token), json={
        "user_plant_id": plant_id,
        "answers": _valid_answers(questions),
    })
    assert response.status_code == 404
