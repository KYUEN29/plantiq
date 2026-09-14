import uuid
from sqlalchemy import Column, String, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base, GUID, TimestampMixin


class PlantSymptom(Base, TimestampMixin):
    __tablename__ = "plant_symptoms"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    plant_species_id = Column(GUID, ForeignKey("plant_species.id", ondelete="CASCADE"), nullable=True, index=True)
    symptom_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    possible_causes = Column(JSON, nullable=True)
    severity = Column(String(50), nullable=True)
    diagnostic_questions = Column(JSON, nullable=True)
    recommended_actions = Column(JSON, nullable=True)

    # Relationships
    plant_species = relationship("PlantSpecies", back_populates="symptoms")
