from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class GardenPlantSpecies(BaseModel):
    id: UUID
    common_name: str
    scientific_name: str
    image_url: Optional[str] = None


class GardenPlantCreate(BaseModel):
    plant_species_id: UUID
    nickname: Optional[str] = Field(None, min_length=1, max_length=255)
    growth_stage: Optional[str] = Field(None, max_length=50)
    soil_type: Optional[str] = Field(None, max_length=50)
    pot_size: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=5000)


class GardenPlantUpdate(BaseModel):
    plant_species_id: Optional[UUID] = None
    nickname: Optional[str] = Field(None, min_length=1, max_length=255)
    growth_stage: Optional[str] = Field(None, max_length=50)
    soil_type: Optional[str] = Field(None, max_length=50)
    pot_size: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=5000)


class GardenPlantResponse(BaseModel):
    id: UUID
    plant_species_id: UUID
    nickname: str
    growth_stage: Optional[str] = None
    soil_type: Optional[str] = None
    pot_size: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    date_added: datetime
    created_at: datetime
    updated_at: datetime
    plant_species: GardenPlantSpecies
