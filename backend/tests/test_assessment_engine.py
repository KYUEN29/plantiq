"""Phase 7: deterministic assessment intelligence for all 40 catalogue plants.

No ML model runs here; no predictions are fabricated. Every test asserts on
the rule-based engine wired through POST /assessments.
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


def _garden_plant(client, token, species_id, nickname="Test plant"):
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
        elif question["question_type"] == "multi_choice":
            value = [question["options"][0]["value"]]
        else:
            value = question["options"][0]["value"]
        payload.append({"question_id": question["id"], "value": value})
    return payload


def _submit(client, token, plant_id, questions, overrides):
    response = client.post("/assessments", headers=_auth(token), json={
        "user_plant_id": plant_id,
        "answers": _answers(questions, overrides),
    })
    return response


HEALTHY_SNAKE = {
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


def test_healthy_assessment_scores_high_with_no_issues(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)

    response = _submit(client, token, plant_id, questions, HEALTHY_SNAKE)
    assert response.status_code == 201
    result = response.json()["result"]
    assert result["health_score"] >= 80
    assert result["health_status"] == "Healthy"
    assert result["confidence"] == "High"
    assert result["issues"] == []
    assert result["quantitative_ml"]["predicted"] is False


def test_abnormal_conditions_are_detected_with_evidence(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Aloe vera"), "Aloe")
    questions = _questions(client, token)

    response = _submit(client, token, plant_id, questions, {
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
    })
    assert response.status_code == 201
    result = response.json()["result"]
    assert result["health_score"] == 77
    assert result["health_status"] == "Needs attention"
    watering = next(d for d in result["dimensions"] if d["feature"] == "watering")
    assert watering["finding"] == "concerning"
    assert "overwatering" in watering["detail"]
    assert len(result["recommendations"]) >= 1
    assert all(r["source"] == "curated" for r in result["recommendations"])


def test_known_symptom_matches_species_knowledge(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Spathiphyllum spp."), "Lily")
    questions = _questions(client, token)

    response = _submit(client, token, plant_id, questions, {**HEALTHY_SNAKE, "symptoms": ["brown_tips"]})
    assert response.status_code == 201
    result = response.json()["result"]
    codes = [i["code"] for i in result["issues"]]
    assert "known:brown_tips" in codes
    assert any("known to develop" in i["title"] for i in result["issues"])


def test_unknown_answers_limit_confidence_without_fabrication(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)
    # Each question's most uncertain valid option ("unknown" where offered,
    # otherwise the vaguest routine/condition value the schema allows).
    unknowns = {}
    for q in questions:
        values = [o["value"] for o in q["options"]]
        if q["question_type"] == "multi_choice":
            unknowns[q["maps_to_feature"]] = ["other"]
        elif "unknown" in values:
            unknowns[q["maps_to_feature"]] = "unknown"
        else:
            unknowns[q["maps_to_feature"]] = values[-1]
    assert "unknown" in unknowns.values()

    response = _submit(client, token, plant_id, questions, unknowns)
    assert response.status_code == 201
    result = response.json()["result"]
    assert result["confidence"] == "Moderate"
    assert len(result["limitations"]) > 0
    assert result["health_status"] == "Healthy"


def test_ml_supported_plant_gets_engine_result_without_ml_output(client):
    from database.connection import SessionLocal
    from database.models.assessment import Assessment

    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)

    response = _submit(client, token, plant_id, questions, HEALTHY_SNAKE)
    assert response.status_code == 201
    body = response.json()
    assert body["result"]["health_score"] == 100

    session = SessionLocal()
    try:
        row = session.query(Assessment).filter_by(id=body["id"]).one()
        assert row.health_score == 100
        assert row.ml_inputs is None
        assert row.ml_output is None
        assert row.water_needed is None
        assert row.ai_explanation is None
        assert set(row.answers.keys()) == {q["maps_to_feature"] for q in questions}
    finally:
        session.close()


def test_three_non_ml_plants_get_engine_results(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    questions = _questions(client, token)
    for scientific, nickname in (
        ("Zamioculcas zamiifolia", "ZZ"),
        ("Rosa spp.", "Rose"),
        ("Solanum lycopersicum", "Tomato"),
    ):
        plant_id = _garden_plant(client, token, _species_id(scientific), nickname)
        response = _submit(client, token, plant_id, questions, HEALTHY_SNAKE)
        assert response.status_code == 201, scientific
        result = response.json()["result"]
        assert result["health_score"] >= 0
        assert result["quantitative_ml"]["predicted"] is False


def test_all_40_species_reach_engine_without_unsupported_error(client):
    from database.connection import SessionLocal
    from database.models.plant_species import PlantSpecies

    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    questions = _questions(client, token)

    session = SessionLocal()
    species_ids = [str(p.id) for p in session.query(PlantSpecies).all()]
    session.close()
    assert len(species_ids) == 40

    for species_id in species_ids:
        plant_id = _garden_plant(client, token, species_id)
        response = _submit(client, token, plant_id, questions, HEALTHY_SNAKE)
        assert response.status_code == 201, species_id
        assert response.json()["result"] is not None


def test_same_answers_same_plant_give_same_result(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)

    first = _submit(client, token, plant_id, questions, HEALTHY_SNAKE).json()["result"]
    second = _submit(client, token, plant_id, questions, HEALTHY_SNAKE).json()["result"]
    assert first == second


def test_assessment_result_is_retrievable_with_same_scores(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)

    created = _submit(client, token, plant_id, questions, HEALTHY_SNAKE).json()
    fetched = client.get(f"/assessments/{created['id']}", headers=_auth(token))
    assert fetched.status_code == 200
    assert fetched.json()["result"] == created["result"]


def test_other_user_cannot_read_assessment_result(client):
    _seed()
    owner_token = _register(client, "Engine Owner", "engine@example.com")
    other_token = _register(client, "Other User", "other@example.com")
    client.cookies.clear()
    plant_id = _garden_plant(client, owner_token, _species_id("Dracaena trifasciata"))
    questions = _questions(client, owner_token)
    created = _submit(client, owner_token, plant_id, questions, HEALTHY_SNAKE).json()
    assert client.get(f"/assessments/{created['id']}", headers=_auth(other_token)).status_code == 404


def test_sequential_submissions_behave_like_queue(client):
    _seed()
    token = _register(client, "Engine Owner", "engine@example.com")
    questions = _questions(client, token)
    ids = set()
    for scientific, nickname in (("Dracaena trifasciata", "One"), ("Rosa spp.", "Two")):
        plant_id = _garden_plant(client, token, _species_id(scientific), nickname)
        response = _submit(client, token, plant_id, questions, HEALTHY_SNAKE)
        assert response.status_code == 201
        ids.add(response.json()["id"])
    assert len(ids) == 2
