import uuid
from datetime import datetime, timezone
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
    # Immutable Phase 8 snapshot of the deterministic engine result at creation
    # time, so historical display never changes when curated knowledge evolves.
    result = Column(JSON, nullable=True)
    contract_version = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default='in_progress')
    structured_answers = Column(JSON, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    # Client-side microsecond timestamp: SQLite's CURRENT_TIMESTAMP only has
    # 1-second resolution, which ties back-to-back queue submissions and breaks
    # chronological history/analytics ordering. The server default remains as a
    # fallback for raw SQL inserts; no DDL change, so no migration is needed.
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        server_default=func.now(), nullable=False)

    # Relationships
    user_plant = relationship("UserPlant", back_populates="assessments")
    assessment_answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="assessment", cascade="all, delete-orphan")
