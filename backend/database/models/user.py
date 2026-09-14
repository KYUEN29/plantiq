import uuid
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from database.base import Base, GUID, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    experience_level = Column(String(50), nullable=True)
    care_preference = Column(String(100), nullable=True)

    # Relationships
    user_plants = relationship("UserPlant", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user")
