"""Phase 9: feedback, personalization context, and aggregate experiences.

No model retraining happens here; no predictions are fabricated. The Random
Forest and Gemini paths are asserted unchanged by the existing suites.
"""


def _register(client, name, email):
    response = client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": "correct-horse-battery-staple",
    })
    assert response.status_code == 201
    return response.cookies.get("access_token")


def _seed():
    from data.seed_symptoms import seed_symptoms
    from database.connection import SessionLocal
    seed_symptoms(SessionLocal())


def _species_id(scientific):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies
    session = SessionLocal()
    species_id = session.query(PlantSpecies).filter_by(scientific_name=scientific).one().id
    session.close()
    return species_id


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _garden_plant(client, token, species_id, nickname="Feedback plant"):
    response = client.post("/garden", headers=_auth(token), json={
        "plant_species_id": str(species_id), "nickname": nickname,
    })
    assert response.status_code == 201
    return response.json()["id"]


def _questions(client, token):
    response = client.get("/questionnaires/current/questions", headers=_auth(token))
    assert response.status_code == 200
    return response.json()


def _answers(questions, overrides):
    payload = []
    for question in questions:
        feature = question["maps_to_feature"]
        if feature in overrides:
            value = overrides[feature]
        else:
            value = question["options"][0]["value"]
        payload.append({"question_id": question["id"], "value": value})
    return payload


def _submit(client, token, plant_id, questions, overrides):
    response = client.post("/assessments", headers=_auth(token), json={
        "user_plant_id": plant_id,
        "answers": _answers(questions, overrides),
    })
    assert response.status_code == 201
    return response.json()


BENIGN = {
    "time_since_last_water": "2_3_days",
    "watering_frequency": "every_1_2_weeks",
    "moisture": "slightly_dry",
    "sunlight_hours": "4_6h",
    "light": "indirect",
    "soil_type": "well_draining_mix",
    "pot_size": "appropriate",
    "growth_stage": "mature",
    "temperature": "20_25c",
    "humidity": "moderate",
    "symptoms": ["healthy"],
}

WET = {
    "time_since_last_water": "today",
    "watering_frequency": "daily",
    "moisture": "waterlogged",
    "sunlight_hours": "6_8h",
    "light": "direct",
    "soil_type": "succulent_cactus_mix",
    "pot_size": "appropriate",
    "growth_stage": "mature",
    "temperature": "20_25c",
    "humidity": "moderate",
    "symptoms": ["wilting"],
}


def _setup(client):
    _seed()
    token = _register(client, "Fan", "fan@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)
    assessment = _submit(client, token, plant_id, questions, BENIGN)
    return token, plant_id, questions, assessment


def test_authenticated_user_can_submit_and_read_feedback(client):
    token, _, _, assessment = _setup(client)
    created = client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token), json={
        "helpfulness": "helpful", "reasons": ["recommendation_worked", "plant_improved"],
    })
    assert created.status_code == 200
    body = created.json()
    assert body["assessment_id"] == assessment["id"]
    assert body["helpfulness"] == "helpful"
    assert body["reasons"] == ["plant_improved", "recommendation_worked"]

    fetched = client.get(f"/assessments/{assessment['id']}/feedback", headers=_auth(token))
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


def test_unauthenticated_feedback_is_rejected(client):
    token, _, _, assessment = _setup(client)
    client.cookies.clear()
    assert client.post(f"/assessments/{assessment['id']}/feedback",
                       json={"helpfulness": "helpful"}).status_code == 401
    assert client.get(f"/assessments/{assessment['id']}/feedback").status_code == 401
    # Sanity: the auth path still works.
    assert client.get(f"/assessments/{assessment['id']}/feedback", headers=_auth(token)).status_code == 404


def test_user_cannot_touch_another_users_feedback(client):
    token, _, _, assessment = _setup(client)
    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    assert client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(other_token),
                       json={"helpfulness": "helpful"}).status_code == 404
    assert client.get(f"/assessments/{assessment['id']}/feedback", headers=_auth(other_token)).status_code == 404


def test_invalid_helpfulness_and_reason_are_rejected(client):
    token, _, _, assessment = _setup(client)
    assert client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token),
                       json={"helpfulness": "awesome"}).status_code == 422
    assert client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token),
                       json={"helpfulness": "helpful", "reasons": ["mind_reading"]} ).status_code == 422


def test_duplicate_feedback_updates_single_row(client):
    from database.connection import SessionLocal
    from database.models.feedback import Feedback

    token, _, _, assessment = _setup(client)
    first = client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token),
                        json={"helpfulness": "helpful"}).json()
    second = client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token),
                         json={"helpfulness": "not_helpful", "reasons": ["advice_unclear"]}).json()
    assert first["id"] == second["id"]
    assert second["helpfulness"] == "not_helpful"

    session = SessionLocal()
    try:
        rows = session.query(Feedback).filter_by(assessment_id=assessment["id"]).all()
        assert len(rows) == 1
        assert rows[0].helpfulness == "not_helpful"
        assert rows[0].helpful is False
        assert rows[0].user_id is not None
    finally:
        session.close()


def test_feedback_persists_with_correct_association_and_experience(client):
    from database.connection import SessionLocal
    from database.models.feedback import Feedback
    from database.models.plant_experience import PlantExperience

    token, _, _, assessment = _setup(client)
    client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token),
                json={"helpfulness": "helpful", "reasons": ["recommendation_worked"]})

    session = SessionLocal()
    try:
        row = session.query(Feedback).filter_by(assessment_id=assessment["id"]).one()
        assert row.helpfulness == "helpful"
        assert row.helpful is True
        assert row.reasons == ["recommendation_worked"]
        assert row.user_id is not None

        experiences = session.query(PlantExperience).all()
        assert len(experiences) == 1
        exp = experiences[0]
        assert exp.sample_count == 1
        assert exp.success_count == 1
        assert exp.confidence_score == 1.0
    finally:
        session.close()


def test_single_assessment_produces_no_recurring_pattern(client):
    token, plant_id, questions, assessment = _setup(client)
    body = client.get(f"/assessments/garden/{plant_id}/personalization", headers=_auth(token)).json()
    assert body["plant"]["assessment_count"] == 1
    assert body["plant"]["recurring_issues"] == []
    assert body["plant"]["notes"] == []
    assert body["user"]["total_assessments"] == 1
    assert body["user"]["recurring_issues"] == []


def test_repeated_issue_is_detected_from_real_history(client):
    token, plant_id, questions, _ = _setup(client)
    lily_id = _garden_plant(client, token, _species_id("Spathiphyllum spp."), "Lily")
    symptomatic = {**BENIGN, "symptoms": ["brown_tips"]}
    _submit(client, token, lily_id, questions, symptomatic)
    _submit(client, token, lily_id, questions, symptomatic)

    body = client.get(f"/assessments/garden/{lily_id}/personalization", headers=_auth(token)).json()
    assert body["plant"]["assessment_count"] == 2
    codes = [i["code"] for i in body["plant"]["recurring_issues"]]
    assert "known:brown_tips" in codes
    assert any("before" in note for note in body["plant"]["notes"])

    other_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Other snake")
    other_body = client.get(f"/assessments/garden/{other_id}/personalization", headers=_auth(token)).json()
    assert other_body["plant"]["recurring_issues"] == []


def test_feedback_signals_aggregate_without_leaking_across_users(client):
    token, plant_id, questions, assessment = _setup(client)
    client.post(f"/assessments/{assessment['id']}/feedback", headers=_auth(token),
                json={"helpfulness": "not_helpful"})

    body = client.get(f"/assessments/garden/{plant_id}/personalization", headers=_auth(token)).json()
    assert body["plant"]["feedback"]["not_helpful"] == 1
    assert body["user"]["feedback"]["not_helpful"] == 1

    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    assert client.get(f"/assessments/garden/{plant_id}/personalization",
                      headers=_auth(other_token)).status_code == 404
    other_plant = _garden_plant(client, other_token, _species_id("Rosa spp."), "Rose")
    other_body = client.get(f"/assessments/garden/{other_plant}/personalization",
                            headers=_auth(other_token)).json()
    assert other_body["user"]["feedback"] == {"helpful": 0, "partially_helpful": 0, "not_helpful": 0}


def test_new_assessment_response_carries_personalization_notes(client):
    token, plant_id, questions, _ = _setup(client)
    lily_id = _garden_plant(client, token, _species_id("Spathiphyllum spp."), "Lily")
    symptomatic = {**BENIGN, "symptoms": ["brown_tips"]}
    _submit(client, token, lily_id, questions, symptomatic)
    _submit(client, token, lily_id, questions, symptomatic)
    third = _submit(client, token, lily_id, questions, symptomatic)
    notes = third["personalization"]["plant"]["notes"]
    assert any("before" in note for note in notes)


def test_preferences_update_with_validation(client):
    token, _, _, _ = _setup(client)
    updated = client.patch("/auth/me", headers=_auth(token), json={
        "experience_level": "beginner", "care_preference": "simple",
    })
    assert updated.status_code == 200
    assert updated.json()["experience_level"] == "beginner"
    assert updated.json()["care_preference"] == "simple"
    assert client.patch("/auth/me", headers=_auth(token),
                        json={"experience_level": "guru"}).status_code == 422
    assert client.patch("/auth/me", headers=_auth(token),
                        json={"care_preference": "telepathic"}).status_code == 422

    me = client.get("/auth/me", headers=_auth(token)).json()
    assert me["experience_level"] == "beginner"

    from database.connection import SessionLocal
    from database.models.user import User
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email="fan@example.com").one()
        assert user.experience_level == "beginner"
    finally:
        session.close()
