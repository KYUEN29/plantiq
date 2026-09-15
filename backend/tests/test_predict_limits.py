import pytest


def _plant(name):
    return {
        "name": name,
        "water": "Properly watered",
        "sunlight": "Partial shade",
        "color": "Healthy green",
        "soil": "Moist",
    }


def test_unsupported_species_message_is_safe_and_specific(client):
    response = client.post("/predict", json={"plants": [_plant("ZZ Plant")]})
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "ZZ Plant" in detail
    assert "not yet available" in detail
    assert "10 species" in detail
    assert "saved" in detail
    assert "Only the official 10 curated" not in detail


def test_supported_species_still_predicts(client, tmp_path, monkeypatch):
    import services.history_service as history_module
    monkeypatch.setattr(history_module, "HISTORY_FILE", tmp_path / "history.json")
    response = client.post("/predict", json={"plants": [_plant("Snake Plant")]})
    assert response.status_code == 200
    assert response.json()["results"][0]["plant"] == "Snake Plant"


def test_preprocess_rejects_unknown_plant_instead_of_fern_fallback():
    from utils.plant_helpers import preprocess_input
    with pytest.raises(ValueError, match="not yet available"):
        preprocess_input(_plant("ZZ Plant"))
    assert preprocess_input(_plant("Fern"))["plant_type"] == "Fern"
