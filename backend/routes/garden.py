from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload

from database.connection import get_db
from database.models.plant_species import PlantSpecies
from database.models.user import User
from database.models.user_plant import UserPlant
from schemas.garden import GardenPlantCreate, GardenPlantResponse, GardenPlantSpecies, GardenPlantUpdate
from utils.auth_helpers import get_current_user


router = APIRouter(prefix="/garden", tags=["My Garden"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _response(plant: UserPlant) -> GardenPlantResponse:
    species = plant.plant_species
    return GardenPlantResponse(
        id=plant.id,
        plant_species_id=plant.plant_species_id,
        nickname=plant.nickname,
        growth_stage=plant.growth_stage,
        soil_type=plant.soil_type,
        pot_size=plant.pot_size,
        location=plant.location_description,
        notes=plant.notes,
        date_added=plant.date_added,
        created_at=plant.created_at,
        updated_at=plant.updated_at,
        plant_species=GardenPlantSpecies(
            id=species.id,
            common_name=species.common_name,
            scientific_name=species.scientific_name,
            image_url=species.image_url,
        ),
    )


def _owned_plant(db: Session, plant_id: UUID, user_id: UUID) -> UserPlant:
    plant = (
        db.query(UserPlant)
        .options(joinedload(UserPlant.plant_species))
        .filter(UserPlant.id == plant_id, UserPlant.user_id == user_id)
        .one_or_none()
    )
    if plant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garden plant not found.")
    return plant


@router.get("", response_model=list[GardenPlantResponse])
def list_garden(current_user: CurrentUser, db: DbSession):
    plants = (
        db.query(UserPlant)
        .options(joinedload(UserPlant.plant_species))
        .filter(UserPlant.user_id == current_user.id)
        .order_by(UserPlant.date_added.desc())
        .all()
    )
    return [_response(plant) for plant in plants]


@router.post("", response_model=GardenPlantResponse, status_code=status.HTTP_201_CREATED)
def add_garden_plant(payload: GardenPlantCreate, current_user: CurrentUser, db: DbSession):
    species = db.get(PlantSpecies, payload.plant_species_id)
    if species is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plant species not found.")

    plant = UserPlant(
        user_id=current_user.id,
        plant_species_id=species.id,
        nickname=payload.nickname.strip() if payload.nickname else species.common_name,
        growth_stage=payload.growth_stage,
        soil_type=payload.soil_type,
        pot_size=payload.pot_size,
        location_description=payload.location,
        notes=payload.notes,
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)
    plant.plant_species = species
    return _response(plant)


@router.get("/{plant_id}", response_model=GardenPlantResponse)
def get_garden_plant(plant_id: UUID, current_user: CurrentUser, db: DbSession):
    return _response(_owned_plant(db, plant_id, current_user.id))


@router.patch("/{plant_id}", response_model=GardenPlantResponse)
def update_garden_plant(plant_id: UUID, payload: GardenPlantUpdate, current_user: CurrentUser, db: DbSession):
    plant = _owned_plant(db, plant_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)

    if "plant_species_id" in updates:
        species = db.get(PlantSpecies, updates["plant_species_id"])
        if species is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plant species not found.")
        plant.plant_species_id = species.id
        plant.plant_species = species
    if "location" in updates:
        plant.location_description = updates.pop("location")
    for field, value in updates.items():
        if field != "plant_species_id":
            setattr(plant, field, value)

    db.commit()
    db.refresh(plant)
    return _response(_owned_plant(db, plant.id, current_user.id))


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_garden_plant(plant_id: UUID, current_user: CurrentUser, db: DbSession):
    plant = _owned_plant(db, plant_id, current_user.id)
    db.delete(plant)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
