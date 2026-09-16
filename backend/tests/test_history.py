"""Phase 8: PostgreSQL-backed assessment history and plant analytics."""


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


def _garden_plant(client, token, species_id, nickname="History plant"):
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

STRESSED = {
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


def _two_assessments(client):
    _seed()
    token = _register(client, "Historian", "historian@example.com")
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)
    first = _submit(client, token, plant_id, questions, BENIGN)
    second = _submit(client, token, plant_id, questions, STRESSED)
    return token, plant_id, first, second


def test_user_can_retrieve_own_history_newest_first(client):
    token, plant_id, first, second = _two_assessments(client)
    body = client.get("/assessments", headers=_auth(token)).json()
    assert body["total"] == 2
    assert [i["id"] for i in body["items"]] == [second["id"], first["id"]]
    item = body["items"][0]
    assert item["user_plant_id"] == plant_id
    assert item["nickname"] == "Snake"
    assert item["common_name"] == "Snake Plant"
    assert item["health_score"] == second["result"]["health_score"]
    assert item["health_status"] == second["result"]["health_status"]
    assert "password" not in str(body).lower()


def test_unauthenticated_history_request_returns_401(client):
    _two_assessments(client)
    client.cookies.clear()
    assert client.get("/assessments").status_code == 401
    assert client.get("/assessments?limit=5&offset=0").status_code == 401


def test_user_cannot_retrieve_another_users_history(client):
    token, _, _, _ = _two_assessments(client)
    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    assert client.get("/assessments", headers=_auth(other_token)).json()["total"] == 0
    foreign_id = client.get("/assessments", headers=_auth(token)).json()["items"][0]["id"]
    assert client.get(f"/assessments/{foreign_id}", headers=_auth(other_token)).status_code == 404


def test_plant_history_requires_ownership_and_orders_newest_first(client):
    token, plant_id, first, second = _two_assessments(client)
    body = client.get(f"/assessments/garden/{plant_id}/assessments", headers=_auth(token)).json()
    assert body["total"] == 2
    assert [i["id"] for i in body["items"]] == [second["id"], first["id"]]

    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    assert client.get(f"/assessments/garden/{plant_id}/assessments", headers=_auth(other_token)).status_code == 404
    assert client.get("/assessments/garden/00000000-0000-0000-0000-000000000000/assessments",
                       headers=_auth(other_token)).status_code == 404


def test_history_pagination_limits(client):
    token, plant_id, _, _ = _two_assessments(client)
    page = client.get("/assessments?limit=1&offset=0", headers=_auth(token)).json()
    assert page["total"] == 2
    assert len(page["items"]) == 1
    assert page["limit"] == 1
    assert page["offset"] == 0
    second_page = client.get("/assessments?limit=1&offset=1", headers=_auth(token)).json()
    assert len(second_page["items"]) == 1
    assert second_page["items"][0]["id"] != page["items"][0]["id"]
    assert client.get("/assessments?limit=101", headers=_auth(token)).status_code == 422


def test_analytics_values_are_computed_from_stored_rows(client):
    token, plant_id, first, second = _two_assessments(client)
    body = client.get(f"/assessments/garden/{plant_id}/analytics", headers=_auth(token)).json()
    assert body["plant"]["nickname"] == "Snake"
    assert body["plant"]["common_name"] == "Snake Plant"
    summary = body["summary"]
    assert summary["assessment_count"] == 2
    assert summary["latest_score"] == second["result"]["health_score"]
    assert summary["previous_score"] == first["result"]["health_score"]
    assert summary["score_change"] == summary["latest_score"] - summary["previous_score"]
    assert summary["average_score"] == round((first["result"]["health_score"] + second["result"]["health_score"]) / 2, 1)
    assert summary["highest_score"] == max(first["result"]["health_score"], second["result"]["health_score"])
    assert summary["lowest_score"] == min(first["result"]["health_score"], second["result"]["health_score"])
    assert sum(body["status_counts"].values()) == 2
    assert [p["score"] for p in body["timeline"]] == [first["result"]["health_score"], second["result"]["health_score"]]
    assert body["timeline"][0]["date"] <= body["timeline"][1]["date"]


def test_analytics_rejects_foreign_plant_and_empty_history(client):
    token, plant_id, _, _ = _two_assessments(client)
    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    assert client.get(f"/assessments/garden/{plant_id}/analytics", headers=_auth(other_token)).status_code == 404

    fresh_plant = _garden_plant(client, other_token, _species_id("Rosa spp."), "Rose")
    body = client.get(f"/assessments/garden/{fresh_plant}/analytics", headers=_auth(other_token)).json()
    assert body["summary"]["assessment_count"] == 0
    assert body["summary"]["latest_score"] is None
    assert body["timeline"] == []
    assert sum(body["status_counts"].values()) == 0


def test_historical_result_is_frozen_snapshot(client):
    from database.connection import SessionLocal
    from database.models.assessment import Assessment

    token, plant_id, first, _ = _two_assessments(client)
    session = SessionLocal()
    try:
        row = session.query(Assessment).filter_by(id=first["id"]).one()
        assert isinstance(row.result, dict)
        assert row.result["health_score"] == first["result"]["health_score"]
        row.result = {**row.result, "health_score": -1, "health_status": "Tampered"}
        session.commit()
    finally:
        session.close()
    fetched = client.get(f"/assessments/{first['id']}", headers=_auth(token)).json()
    assert fetched["result"]["health_score"] == -1
    assert fetched["result"]["health_status"] == "Tampered"
