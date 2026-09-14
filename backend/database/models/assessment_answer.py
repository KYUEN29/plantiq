import uuid
from sqlalchemy import Column, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database.base import Base, GUID


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    assessment_id = Column(GUID, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(GUID, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True, index=True)
    answer_value = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assessment = relationship("Assessment", back_populates="assessment_answers")
    question = relationship("Question", back_populates="assessment_answers")
