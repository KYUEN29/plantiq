import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database.base import Base, GUID


class Question(Base):
    __tablename__ = "questions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    questionnaire_id = Column(GUID, ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)
    question_order = Column(Integer, nullable=False, default=0)
    is_required = Column(Boolean, default=True, nullable=False)
    options = Column(JSON, nullable=True)
    maps_to_feature = Column(String(100), nullable=True)
    conditional_rule = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    questionnaire = relationship("Questionnaire", back_populates="questions")
    assessment_answers = relationship("AssessmentAnswer", back_populates="question")
