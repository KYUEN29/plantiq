from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models.plant_species import PlantSpecies
from database.models.plant_symptom import PlantSymptom
from schemas.plants import PlantSpeciesResponse, PlantSymptomResponse


router = APIRouter(prefix="/plants", tags=["Plant Catalogue"])


@router.get("", response_model=list[PlantSpeciesResponse])
def list_plants(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = None,
    difficulty: str | None = None,
    indoor_suitable: bool | None = None,
    light_requirement: str | None = None,
    search: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
):
    query = db.query(PlantSpecies)
    if category:
        query = query.filter(PlantSpecies.category == category)
    if difficulty:
        query = query.filter(PlantSpecies.difficulty == difficulty)
    if indoor_suitable is not None:
        query = query.filter(PlantSpecies.is_indoor_suitable == indoor_suitable)
    if light_requirement:
        query = query.filter(PlantSpecies.light_requirement == light_requirement)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(PlantSpecies.common_name.ilike(pattern), PlantSpecies.scientific_name.ilike(pattern)))
    return query.order_by(PlantSpecies.common_name).all()


@router.get("/{plant_id}", response_model=PlantSpeciesResponse)
def get_plant(plant_id: UUID, db: Annotated[Session, Depends(get_db)]):
    plant = db.get(PlantSpecies, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant species not found.")
    return plant


@router.get("/{plant_id}/symptoms", response_model=list[PlantSymptomResponse])
def get_plant_symptoms(plant_id: UUID, db: Annotated[Session, Depends(get_db)]):
    plant = db.get(PlantSpecies, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant species not found.")
    return (
        db.query(PlantSymptom)
        .filter(PlantSymptom.plant_species_id == plant_id)
        .order_by(PlantSymptom.symptom_name)
        .all()
    )
