from uuid import uuid4


def _register(client, name, email):
    response = client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": "correct-horse-battery-staple",
    })
    assert response.status_code == 201
    return response.cookies.get("access_token")


def _seed_and_species_id():
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


def test_garden_crud_for_authenticated_owner(client):
    species_id = _seed_and_species_id()
    token = _register(client, "Garden Owner", "owner@example.com")

    client.cookies.clear()
    assert client.get("/garden").status_code == 401
    assert client.get("/garden", headers=_auth(token)).json() == []

    created = client.post("/garden", headers=_auth(token), json={
        "plant_species_id": str(species_id), "nickname": "Living room snake",
        "growth_stage": "mature", "location": "Living room", "notes": "Near the window",
    })
    assert created.status_code == 201
    plant = created.json()
    assert plant["nickname"] == "Living room snake"
    assert plant["location"] == "Living room"
    assert plant["plant_species"]["scientific_name"] == "Dracaena trifasciata"

    assert client.get(f"/garden/{plant['id']}", headers=_auth(token)).status_code == 200
    updated = client.patch(f"/garden/{plant['id']}", headers=_auth(token), json={"nickname": "Snake", "pot_size": "medium"})
    assert updated.status_code == 200
    assert updated.json()["nickname"] == "Snake"
    assert updated.json()["pot_size"] == "medium"
    assert client.delete(f"/garden/{plant['id']}", headers=_auth(token)).status_code == 204
    assert client.get(f"/garden/{plant['id']}", headers=_auth(token)).status_code == 404


def test_garden_rejects_unknown_species_and_cross_user_access(client):
    species_id = _seed_and_species_id()
    owner_token = _register(client, "Garden Owner", "owner@example.com")
    other_token = _register(client, "Other User", "other@example.com")
    client.cookies.clear()

    invalid = client.post("/garden", headers=_auth(owner_token), json={"plant_species_id": str(uuid4())})
    assert invalid.status_code == 400

    created = client.post("/garden", headers=_auth(owner_token), json={"plant_species_id": str(species_id)})
    assert created.status_code == 201
    plant_id = created.json()["id"]

    assert client.get("/garden", headers=_auth(other_token)).json() == []
    assert client.get(f"/garden/{plant_id}", headers=_auth(other_token)).status_code == 404
    assert client.patch(f"/garden/{plant_id}", headers=_auth(other_token), json={"nickname": "Stolen"}).status_code == 404
    assert client.delete(f"/garden/{plant_id}", headers=_auth(other_token)).status_code == 404
    assert client.get(f"/garden/{plant_id}", headers=_auth(owner_token)).status_code == 200
