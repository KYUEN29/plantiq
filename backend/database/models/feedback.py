import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from database.base import Base, GUID


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    assessment_id = Column(GUID, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    helpful = Column(Boolean, nullable=False)
    # Normalized Phase 9 values: helpful | partially_helpful | not_helpful.
    # The legacy Boolean stays populated (True only for "helpful") so any
    # older reader keeps working; `helpfulness` is the source of truth.
    helpfulness = Column(String(50), nullable=True)
    reasons = Column(JSON, nullable=True)
    outcome = Column(String(100), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assessment = relationship("Assessment", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")
