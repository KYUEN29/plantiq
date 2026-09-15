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
    sunlight_hours_min: float | None = None
    sunlight_hours_ideal: float | None = None
    sunlight_hours_ideal_min: float | None = None
    sunlight_hours_ideal_max: float | None = None
    sunlight_hours_max: float | None = None
    temperature_min: float | None = None
    temperature_ideal_min: float | None = None
    temperature_ideal_max: float | None = None
    temperature_max: float | None = None
    humidity_min: float | None = None
    humidity_ideal_min: float | None = None
    humidity_ideal_max: float | None = None
    humidity_max: float | None = None
    watering_frequency_min_days: int | None = None
    watering_frequency_max_days: int | None = None
    preferred_moisture_min: float | None = None
    preferred_moisture_max: float | None = None
    preferred_soil_types: list[str] | None = None
    drainage_requirement: str | None = None
    moisture_retention: str | None = None
    drought_tolerance: str | None = None
    overwatering_sensitivity: str | None = None
    ph_min: float | None = None
    ph_max: float | None = None
    preferred_pot_size: str | None = None
    pot_drainage_required: bool | None = None
    repotting_interval: str | None = None
    growth_stages: list[str] | None = None
    growth_rate: str | None = None
    mature_size: str | None = None
    fertilizer_type: str | None = None
    fertilizer_frequency: str | None = None
    seasonal_care: dict[str, Any] | None = None
    common_problems: list[dict[str, Any]] | None = None
    care_guidelines: dict[str, Any] | None = None
    source_references: list[dict[str, str]] | None = None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class PlantSymptomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plant_species_id: UUID | None = None
    symptom_name: str
    description: str | None = None
    possible_causes: list[Any] | dict[str, Any] | None = None
    severity: str | None = None
    diagnostic_questions: list[Any] | dict[str, Any] | None = None
    recommended_actions: list[Any] | dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime
