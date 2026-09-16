import pytest
from fastapi.testclient import TestClient

def test_dynamic_question_persistence(client: TestClient):
    """Ensure dynamically created questions persist across requests.
    Walk through assessment until dynamic succulent question (order >= 100) appears, then answer it and expect 200.
    """
    # Create a plant for the assessment
    # Retrieve a succulent plant species from the catalogue
    species_resp = client.get("/plants?category=succulent")
    assert species_resp.status_code == 200, species_resp.text
    species_list = species_resp.json()
    assert species_list, "No succulent plant species found"
    plant_species = species_list[0]
    plant_resp = client.post(
        "/garden",
        json={"plant_species_id": plant_species["id"], "nickname": "TestSucc"},
    )
    assert plant_resp.status_code == 201, plant_resp.text
    plant_id = plant_resp.json()["id"]

    dynamic_q = None
    for _ in range(30):
        resp = client.get(f"/assessments/{plant_id}/next-question")
        assert resp.status_code == 200, resp.text
        payload = resp.json()
        q = payload.get("question")
        if q is None:
            break
        if q.get("question_order", 0) >= 100:
            dynamic_q = q
            break
        answer_payload = {
            "question_id": q["id"],
            "value": (q["options"] or [{"value": "test"}])[0]["value"],
            "finalize": False,
        }
        ans_resp = client.post(
            f"/assessments/{plant_id}/answers",
            json=answer_payload,
        )
        assert ans_resp.status_code == 200, ans_resp.text
    assert dynamic_q is not None, "Dynamic succulent question not reached"

    answer_payload = {
        "question_id": dynamic_q["id"],
        "value": (dynamic_q["options"] or [{"value": "test"}])[0]["value"],
        "finalize": False,
    }
    ans_resp = client.post(
        f"/assessments/{plant_id}/answers",
        json=answer_payload,
    )
    assert ans_resp.status_code == 200, f"Expected 200, got {ans_resp.status_code}: {ans_resp.text}"
