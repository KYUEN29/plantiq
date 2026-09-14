import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base, GUID, TimestampMixin


class PlantExperience(Base, TimestampMixin):
    __tablename__ = "plant_experiences"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    plant_species_id = Column(GUID, ForeignKey("plant_species.id", ondelete="CASCADE"), nullable=False, index=True)
    condition = Column(String(100), nullable=False)
    recommendation_type = Column(String(100), nullable=False)
    observed_outcome = Column(String(100), nullable=True)
    sample_count = Column(Integer, default=1, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)

    # Relationships
    plant_species = relationship("PlantSpecies", back_populates="experiences")
