from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PlantSpeciesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    common_name: str
    scientific_name: str
    aliases: list[str] | None = None
    category: str | None = None
    difficulty: str | None = None
    description: str | None = None
    is_indoor_suitable: bool | None = None
    is_outdoor_suitable: bool | None = None
    light_requirement: str | None = None
    watering_frequency_min_days: int | None = None
    watering_frequency_max_days: int | None = None
    preferred_soil_types: list[str] | None = None
    drainage_requirement: str | None = None
    drought_tolerance: str | None = None
    overwatering_sensitivity: str | None = None
    common_problems: list[dict[str, Any]] | None = None
    care_guidelines: dict[str, Any] | None = None
    source_references: list[dict[str, str]] | None = None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime
