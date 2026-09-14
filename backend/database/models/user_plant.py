import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database.base import Base, GUID, TimestampMixin


class UserPlant(Base, TimestampMixin):
    __tablename__ = "user_plants"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plant_species_id = Column(GUID, ForeignKey("plant_species.id", ondelete="SET NULL"), nullable=True, index=True)
    
    nickname = Column(String(255), nullable=False)
    date_added = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    growth_stage = Column(String(50), nullable=True)
    soil_type = Column(String(50), nullable=True)
    pot_size = Column(String(50), nullable=True)
    location_description = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="user_plants")
    plant_species = relationship("PlantSpecies", back_populates="user_plants")
    assessments = relationship("Assessment", back_populates="user_plant", cascade="all, delete-orphan")
