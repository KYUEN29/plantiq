import uuid
from sqlalchemy import Column, String, Text, Boolean, Float, Integer, JSON
from sqlalchemy.orm import relationship
from database.base import Base, GUID, TimestampMixin


class PlantSpecies(Base, TimestampMixin):
    __tablename__ = "plant_species"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    common_name = Column(String(255), nullable=False, index=True)
    scientific_name = Column(String(255), nullable=False, unique=True)
    aliases = Column(JSON, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    difficulty = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    is_indoor_suitable = Column(Boolean, default=True)
    is_outdoor_suitable = Column(Boolean, default=True)
    
    # Temperature ranges
    temperature_min = Column(Float, nullable=True)
    temperature_ideal_min = Column(Float, nullable=True)
    temperature_ideal_max = Column(Float, nullable=True)
    temperature_max = Column(Float, nullable=True)
    
    # Humidity ranges
    humidity_min = Column(Float, nullable=True)
    humidity_ideal_min = Column(Float, nullable=True)
    humidity_ideal_max = Column(Float, nullable=True)
    humidity_max = Column(Float, nullable=True)
    
    # Light ranges
    light_requirement = Column(String(100), nullable=True)
    sunlight_hours_min = Column(Float, nullable=True)
    sunlight_hours_ideal = Column(Float, nullable=True)
    sunlight_hours_ideal_min = Column(Float, nullable=True)
    sunlight_hours_ideal_max = Column(Float, nullable=True)
    sunlight_hours_max = Column(Float, nullable=True)
    
    # Water & Soil
    watering_frequency_min_days = Column(Integer, nullable=True)
    watering_frequency_max_days = Column(Integer, nullable=True)
    preferred_moisture_min = Column(Float, nullable=True)
    preferred_moisture_max = Column(Float, nullable=True)
    drought_tolerance = Column(String(50), nullable=True)
    overwatering_sensitivity = Column(String(50), nullable=True)
    preferred_soil_types = Column(JSON, nullable=True)
    drainage_requirement = Column(String(100), nullable=True)
    moisture_retention = Column(String(100), nullable=True)
    ph_min = Column(Float, nullable=True)
    ph_max = Column(Float, nullable=True)
    
    # Pot & Growth
    preferred_pot_size = Column(String(50), nullable=True)
    pot_drainage_required = Column(Boolean, default=True)
    repotting_interval = Column(String(100), nullable=True)
    growth_stages = Column(JSON, nullable=True)
    growth_rate = Column(String(50), nullable=True)
    mature_size = Column(String(100), nullable=True)
    
    # Care & Guidelines
    fertilizer_type = Column(String(100), nullable=True)
    fertilizer_frequency = Column(String(100), nullable=True)
    seasonal_care = Column(JSON, nullable=True)
    common_problems = Column(JSON, nullable=True)
    care_guidelines = Column(JSON, nullable=True)
    source_references = Column(JSON, nullable=True)
    image_url = Column(String(500), nullable=True)

    # Relationships
    user_plants = relationship("UserPlant", back_populates="plant_species")
    questionnaires = relationship("Questionnaire", back_populates="plant_species", cascade="all, delete-orphan")
    symptoms = relationship("PlantSymptom", back_populates="plant_species", cascade="all, delete-orphan")
    experiences = relationship("PlantExperience", back_populates="plant_species", cascade="all, delete-orphan")
