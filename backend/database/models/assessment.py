import uuid
from sqlalchemy import Column, String, Text, Float, Integer, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database.base import Base, GUID


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_plant_id = Column(GUID, ForeignKey("user_plants.id", ondelete="CASCADE"), nullable=False, index=True)
    health_score = Column(Float, nullable=True)
    water_needed = Column(Integer, nullable=True)
    confidence = Column(String(50), nullable=True)
    answers = Column(JSON, nullable=True)
    ml_inputs = Column(JSON, nullable=True)
    ml_output = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user_plant = relationship("UserPlant", back_populates="assessments")
    assessment_answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="assessment", cascade="all, delete-orphan")
