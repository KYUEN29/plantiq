from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuestionOption(BaseModel):
    label: str
    value: str


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_text: str
    question_type: str
    question_order: int
    is_required: bool
    options: Optional[list[QuestionOption]] = None
    maps_to_feature: Optional[str] = None


class QuestionnaireResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    version: str
    questions: list[QuestionResponse]


class AssessmentAnswerCreate(BaseModel):
    question_id: UUID
    # Normalized machine-readable value: string for single_choice,
    # list of strings for multi_choice. Never a display label contract.
    value: Any


class AssessmentCreate(BaseModel):
    user_plant_id: UUID
    answers: list[AssessmentAnswerCreate] = Field(min_length=1)


class AssessmentAnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: Optional[UUID] = None
    answer_value: Any
    maps_to_feature: Optional[str] = None


class AssessmentResponse(BaseModel):
    id: UUID
    user_plant_id: UUID
    questionnaire_id: Optional[UUID] = None
    questionnaire_version: Optional[str] = None
    created_at: datetime
    answers: list[AssessmentAnswerResponse]
