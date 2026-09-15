from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class AssessmentDimensionResponse(BaseModel):
    feature: str
    finding: str
    detail: str
    evidence: list[str] = []
    deduction: int = 0


class AssessmentIssueResponse(BaseModel):
    code: str
    title: str
    severity: str
    evidence: list[str] = []


class AssessmentRecommendationResponse(BaseModel):
    issue_code: Optional[str] = None
    text: str
    source: str


class AssessmentMlMarkerResponse(BaseModel):
    predicted: bool
    reason: str


class AssessmentResultResponse(BaseModel):
    health_score: int
    health_status: str
    confidence: str
    completeness: float
    dimensions: list[AssessmentDimensionResponse]
    issues: list[AssessmentIssueResponse]
    recommendations: list[AssessmentRecommendationResponse]
    limitations: list[str]
    quantitative_ml: AssessmentMlMarkerResponse


class RecurringIssueResponse(BaseModel):
    code: str
    title: str
    occurrences: int


class PlantPersonalizationResponse(BaseModel):
    assessment_count: int
    recurring_issues: list[RecurringIssueResponse]
    recent_statuses: list[str]
    feedback: dict[str, int]
    notes: list[str]


class UserPersonalizationResponse(BaseModel):
    total_assessments: int
    recurring_issues: list[RecurringIssueResponse]
    feedback: dict[str, int]
    preferences: dict[str, Optional[str]]
    notes: list[str]


class PersonalizationResponse(BaseModel):
    plant: PlantPersonalizationResponse
    user: UserPersonalizationResponse


class GuidanceRecommendationResponse(BaseModel):
    code: str
    title: str
    description: str
    priority: str
    reason: str
    source: str
    action_type: Optional[str] = None
    what_to_watch: Optional[str] = None


class GuidanceResponse(BaseModel):
    recommendations: list[GuidanceRecommendationResponse]
    personalization_notes: list[str]
    limitations: list[str]
    next_best_action: Optional[GuidanceRecommendationResponse] = None
    historical_comparison: Optional[dict] = None



class ExplanationResponse(BaseModel):
    assessment_id: UUID
    available: bool
    cached: bool
    explanation: Optional[str] = None
    message: Optional[str] = None


class AssessmentResponse(BaseModel):
    id: UUID
    user_plant_id: UUID
    questionnaire_id: Optional[UUID] = None
    questionnaire_version: Optional[str] = None
    created_at: datetime
    answers: list[AssessmentAnswerResponse]
    result: Optional[AssessmentResultResponse] = None
    personalization: Optional[PersonalizationResponse] = None
    guidance: Optional[GuidanceResponse] = None


class AssessmentHistoryItem(BaseModel):
    id: UUID
    user_plant_id: UUID
    nickname: str
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    health_score: Optional[float] = None
    health_status: Optional[str] = None
    confidence: Optional[str] = None
    created_at: datetime


class AssessmentHistoryPage(BaseModel):
    items: list[AssessmentHistoryItem]
    total: int
    limit: int
    offset: int


class PlantAnalyticsSummary(BaseModel):
    assessment_count: int
    latest_score: Optional[float] = None
    previous_score: Optional[float] = None
    score_change: Optional[float] = None
    average_score: Optional[float] = None
    highest_score: Optional[float] = None
    lowest_score: Optional[float] = None


class PlantAnalyticsPoint(BaseModel):
    assessment_id: UUID
    date: datetime
    score: Optional[float] = None
    status: Optional[str] = None


class PlantAnalyticsPlant(BaseModel):
    id: UUID
    nickname: str
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None


class PlantAnalyticsResponse(BaseModel):
    plant: PlantAnalyticsPlant
    summary: PlantAnalyticsSummary
    status_counts: dict[str, int]
    timeline: list[PlantAnalyticsPoint]


HELPFULNESS_VALUES = ("helpful", "partially_helpful", "not_helpful")

REASON_VALUES = (
    "recommendation_worked",
    "recommendation_not_worked",
    "too_much_watering",
    "too_little_watering",
    "light_advice_useful",
    "soil_advice_useful",
    "plant_improved",
    "plant_not_improved",
    "advice_unclear",
    "other",
)


class FeedbackCreate(BaseModel):
    helpfulness: str = Field(pattern="^(helpful|partially_helpful|not_helpful)$")
    reasons: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("reasons")
    @classmethod
    def _validate_reasons(cls, values):
        unknown = [v for v in values if v not in REASON_VALUES]
        if unknown:
            raise ValueError(f"Invalid reason: {unknown[0]}")
        return sorted(set(values))


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assessment_id: UUID
    helpfulness: Optional[str] = None
    reasons: list[str] = []
    created_at: datetime

class NextQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    question: Optional[dict] = None  # Holds QuestionResponse dict
    progress: Optional[int] = None  # Number of answered questions
    total_estimated: Optional[int] = None  # Estimated total questions for this interview

class AnswerSubmission(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    question_id: UUID
    value: Any
    finalize: Optional[bool] = False
