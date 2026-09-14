from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, max_length=128, description="User's password")
    experience_level: Optional[str] = Field(None, description="Plant care experience level (e.g., beginner, intermediate, expert)")
    care_preference: Optional[str] = Field(None, description="Plant care preferences (e.g., low-maintenance, organic)")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    experience_level: Optional[str] = None
    care_preference: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: UserResponse
