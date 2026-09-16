"""Phase 10: deterministic guidance + optional Gemini explanation.

Gemini is always mocked here; no test depends on a real API call. The
assessment itself must succeed with deterministic guidance in every case.
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


def _garden_plant(client, token, species_id, nickname="Guide plant"):
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

WET_ALOE = {
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


class _FakeModels:
    def __init__(self, calls, text="Clear, grounded explanation."):
        self.calls = calls
        self.text = text

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return type("Reply", (), {"text": self.text})()


class _FakeClient:
    def __init__(self, calls, text="Clear, grounded explanation."):
        self.models = _FakeModels(calls, text)


def _mock_client(monkeypatch, calls, text="Clear, grounded explanation."):
    import services.explanation_service as explanation_service
    monkeypatch.setattr(explanation_service, "_get_client", lambda: _FakeClient(calls, text))


def _setup(client):
    _seed()
    token = _register(client, "Guide", "guide@example.com")
    plant_id = _garden_plant(client, token, _species_id("Aloe vera"), "Aloe")
    questions = _questions(client, token)
    return token, plant_id, questions


def test_guidance_is_structured_and_grounded(client):
    token, plant_id, questions = _setup(client)
    body = _submit(client, token, plant_id, questions, WET_ALOE)
    guidance = body["guidance"]
    assert guidance["recommendations"]
    for rec in guidance["recommendations"]:
        assert rec["priority"] in ("high", "medium", "low")
        assert rec["source"] in ("curated", "personalized", "assessment")
        assert rec["code"] and rec["title"] and rec["description"] and rec["reason"]
    assert any(r["priority"] == "high" for r in guidance["recommendations"])
    joined = " ".join(r["reason"] + " " + r["description"] for r in guidance["recommendations"])
    assert "Aloe Vera" in joined
    assert "drain" in joined


def test_guidance_is_deterministic_across_reads(client):
    token, plant_id, questions = _setup(client)
    created = _submit(client, token, plant_id, questions, WET_ALOE)
    first = client.get(f"/assessments/{created['id']}", headers=_auth(token)).json()["guidance"]
    second = client.get(f"/assessments/{created['id']}", headers=_auth(token)).json()["guidance"]
    assert first == second
    assert created["guidance"] == first


def test_simple_vs_detailed_verbosity(client):
    token, plant_id, questions = _setup(client)
    client.patch("/auth/me", headers=_auth(token),
                 json={"experience_level": "beginner", "care_preference": "simple"})
    simple = _submit(client, token, plant_id, questions, WET_ALOE)["guidance"]
    client.patch("/auth/me", headers=_auth(token),
                 json={"experience_level": "experienced", "care_preference": "detailed"})
    detailed = _submit(client, token, plant_id, questions, WET_ALOE)["guidance"]
    assert simple["recommendations"] and detailed["recommendations"]
    assert all(len(r["description"]) <= 150 for r in simple["recommendations"])
    assert any("Evidence:" in r["description"] for r in detailed["recommendations"])


def test_repeated_history_personalizes_without_leaking(client):
    token, plant_id, questions = _setup(client)
    lily_id = _garden_plant(client, token, _species_id("Spathiphyllum spp."), "Lily")
    symptomatic = {**BENIGN, "symptoms": ["brown_tips"]}
    _submit(client, token, lily_id, questions, symptomatic)
    _submit(client, token, lily_id, questions, symptomatic)
    third = _submit(client, token, lily_id, questions, symptomatic)
    personalized = [r for r in third["guidance"]["recommendations"] if r["source"] == "personalized"]
    assert personalized
    assert any("before" in r["reason"] for r in personalized)

    snake_body = _submit(client, token, plant_id, questions, BENIGN)
    assert all(r["source"] != "personalized" for r in snake_body["guidance"]["recommendations"])


def test_single_assessment_has_no_personalized_claims(client):
    token, plant_id, questions = _setup(client)
    body = _submit(client, token, plant_id, questions, BENIGN)
    assert all(r["source"] != "personalized" for r in body["guidance"]["recommendations"])
    assert body["personalization"]["plant"]["notes"] == []


def test_personalization_is_user_isolated(client):
    token, plant_id, questions = _setup(client)
    lily_id = _garden_plant(client, token, _species_id("Spathiphyllum spp."), "Lily")
    symptomatic = {**BENIGN, "symptoms": ["brown_tips"]}
    _submit(client, token, lily_id, questions, symptomatic)
    _submit(client, token, lily_id, questions, symptomatic)

    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    other_plant = _garden_plant(client, other_token, _species_id("Spathiphyllum spp."), "Lily 2")
    other_questions = _questions(client, other_token)
    body = _submit(client, other_token, other_plant, other_questions, symptomatic)
    assert all(r["source"] != "personalized" for r in body["guidance"]["recommendations"])
    assert body["personalization"]["plant"]["notes"] == []


def test_explanation_success_is_cached_and_leaves_snapshot_intact(client, monkeypatch):
    calls = []
    _mock_client(monkeypatch, calls)
    token, plant_id, questions = _setup(client)
    created = _submit(client, token, plant_id, questions, WET_ALOE)
    before = created["result"]

    first = client.post(f"/assessments/{created['id']}/explanation", headers=_auth(token)).json()
    assert first["available"] is True
    assert first["cached"] is False
    assert first["explanation"] == "Clear, grounded explanation."
    second = client.post(f"/assessments/{created['id']}/explanation", headers=_auth(token)).json()
    assert second["cached"] is True
    assert len(calls) == 1

    fetched = client.get(f"/assessments/{created['id']}", headers=_auth(token)).json()
    assert fetched["result"] == before


def test_explanation_failure_never_fails_assessment(client, monkeypatch):
    import services.explanation_service as explanation_service

    class _Boom:
        @property
        def models(self):
            raise RuntimeError("provider down")

    monkeypatch.setattr(explanation_service, "_get_client", lambda: _Boom())
    token, plant_id, questions = _setup(client)
    created = _submit(client, token, plant_id, questions, WET_ALOE)
    assert created["guidance"]["recommendations"]

    body = client.post(f"/assessments/{created['id']}/explanation", headers=_auth(token)).json()
    assert body["available"] is False
    assert body["explanation"] is None
    assert "still available" in body["message"]


def test_malformed_gemini_responses_are_rejected(client, monkeypatch):
    token, plant_id, questions = _setup(client)
    created = _submit(client, token, plant_id, questions, WET_ALOE)
    for bad in (None, "", "   ", 12345):
        calls = []
        _mock_client(monkeypatch, calls, text=bad)
        body = client.post(f"/assessments/{created['id']}/explanation", headers=_auth(token)).json()
        assert body["available"] is False, bad
        assert body["explanation"] is None


def test_explanation_unavailable_without_api_key(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    token, plant_id, questions = _setup(client)
    created = _submit(client, token, plant_id, questions, WET_ALOE)
    assert created["result"]["health_score"] == 77
    body = client.post(f"/assessments/{created['id']}/explanation", headers=_auth(token)).json()
    assert body["available"] is False


def test_explanation_requires_ownership(client, monkeypatch):
    calls = []
    _mock_client(monkeypatch, calls)
    token, _, _ = _setup(client)[:3]
    plant_id = _garden_plant(client, token, _species_id("Dracaena trifasciata"), "Snake")
    questions = _questions(client, token)
    created = _submit(client, token, plant_id, questions, BENIGN)
    other_token = _register(client, "Stranger", "stranger@example.com")
    client.cookies.clear()
    assert client.post(f"/assessments/{created['id']}/explanation",
                       headers=_auth(other_token)).status_code == 404
    assert calls == []


def test_prompt_contains_facts_and_never_secrets(client, monkeypatch):
    import services.explanation_service as explanation_service
    monkeypatch.setenv("GEMINI_API_KEY", "super-secret-key-123")
    assert "Use ONLY" in explanation_service.SYSTEM_INSTRUCTION
    prompt = explanation_service.build_explanation_prompt(
        "My Aloe",
        {"common_name": "Aloe Vera", "light_requirement": "bright_direct"},
        {"health_score": 77, "health_status": "Needs attention",
         "dimensions": [{"feature": "watering", "finding": "concerning", "detail": "Too wet"}],
         "issues": [], "limitations": ["pot: no reference"]},
        ["note one"],
        {"experience_level": "beginner", "care_preference": "simple"},
    )
    assert "bright_direct" in prompt
    assert "super-secret-key-123" not in prompt


def test_unsupported_species_gets_guidance_without_coercion(client):
    token, _, questions = _setup(client)
    zz_id = _garden_plant(client, token, _species_id("Zamioculcas zamiifolia"), "ZZ")
    body = _submit(client, token, zz_id, questions, WET_ALOE)
    assert body["guidance"]["recommendations"]
    joined = " ".join(r["reason"] + " " + r["description"] for r in body["guidance"]["recommendations"])
    assert "ZZ Plant" in joined
    assert body["result"]["quantitative_ml"]["predicted"] is False
    assert client.post("/predict", json={"plants": [{
        "name": "ZZ Plant", "water": "Properly watered", "sunlight": "Partial shade",
        "color": "Healthy green", "soil": "Moist",
    }]}).status_code == 400
