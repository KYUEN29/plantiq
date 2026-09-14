import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database.base import Base, GUID, TimestampMixin


class Questionnaire(Base, TimestampMixin):
    __tablename__ = "questionnaires"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    plant_species_id = Column(GUID, ForeignKey("plant_species.id", ondelete="CASCADE"), nullable=True, index=True)
    version = Column(String(50), nullable=False, default="1.0")
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    plant_species = relationship("PlantSpecies", back_populates="questionnaires")
    questions = relationship("Question", back_populates="questionnaire", cascade="all, delete-orphan")
