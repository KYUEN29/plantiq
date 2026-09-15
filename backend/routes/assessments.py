from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from data.seed_questionnaire import ensure_questionnaire
from database.connection import get_db
from database.models.assessment import Assessment
from database.models.assessment_answer import AssessmentAnswer
from database.models.question import Question
from database.models.user import User
from database.models.user_plant import UserPlant
from schemas.assessments import AssessmentCreate, AssessmentResponse
from utils.auth_helpers import get_current_user


router = APIRouter(prefix="/assessments", tags=["Assessments"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _owned_plant(db: Session, plant_id: UUID, user_id: UUID) -> UserPlant:
    plant = (
        db.query(UserPlant)
        .filter(UserPlant.id == plant_id, UserPlant.user_id == user_id)
        .one_or_none()
    )
    if plant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garden plant not found.",
        )
    return plant


def _assessment_payload(db: Session, assessment: Assessment) -> AssessmentResponse:
    rows = (
        db.query(AssessmentAnswer, Question)
        .outerjoin(Question, AssessmentAnswer.question_id == Question.id)
        .filter(AssessmentAnswer.assessment_id == assessment.id)
        .all()
    )
    answers = [
        {
            "id": answer.id,
            "question_id": answer.question_id,
            "answer_value": answer.answer_value,
            "maps_to_feature": question.maps_to_feature if question is not None else None,
        }
        for answer, question in rows
    ]
    questionnaire_id = None
    questionnaire_version = None
    for answer, question in rows:
        if question is not None:
            questionnaire_id = question.questionnaire_id
            break
    if questionnaire_id is not None:
        from database.models.questionnaire import Questionnaire

        questionnaire = db.get(Questionnaire, questionnaire_id)
        if questionnaire is not None:
            questionnaire_version = questionnaire.version
    return AssessmentResponse(
        id=assessment.id,
        user_plant_id=assessment.user_plant_id,
        questionnaire_id=questionnaire_id,
        questionnaire_version=questionnaire_version,
        created_at=assessment.created_at,
        answers=answers,
    )


def _validate_answers(questions: list[Question], payload: AssessmentCreate) -> dict[str, Question]:
    by_id = {str(q.id): q for q in questions}
    seen: dict[str, Question] = {}

    for item in payload.answers:
        key = str(item.question_id)
        question = by_id.get(key)
        if question is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown question: {item.question_id}",
            )
        if key in seen:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate answer for question: {item.question_id}",
            )
        allowed = {o["value"] for o in (question.options or []) if isinstance(o, dict) and "value" in o}
        if question.question_type == "multi_choice":
            if not isinstance(item.value, list) or not item.value:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Question {item.question_id} requires a non-empty list of values.",
                )
            unknown = [v for v in item.value if v not in allowed]
            if unknown:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid option for question {item.question_id}: {unknown[0]}",
                )
        else:
            if not isinstance(item.value, str) or not item.value:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Question {item.question_id} requires a single option value.",
                )
            if item.value not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid option for question {item.question_id}: {item.value}",
                )
        seen[key] = question

    missing = [q for q in questions if q.is_required and str(q.id) not in seen]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required answer for question: {missing[0].id}",
        )
    return seen


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(payload: AssessmentCreate, current_user: CurrentUser, db: DbSession):
    _owned_plant(db, payload.user_plant_id, current_user.id)
    questionnaire = ensure_questionnaire(db)
    questions = (
        db.query(Question)
        .filter(Question.questionnaire_id == questionnaire.id)
        .order_by(Question.question_order)
        .all()
    )
    _validate_answers(questions, payload)

    assessment = Assessment(user_plant_id=payload.user_plant_id)
    db.add(assessment)
    db.flush()
    for item in payload.answers:
        db.add(
            AssessmentAnswer(
                assessment_id=assessment.id,
                question_id=item.question_id,
                answer_value=item.value,
            )
        )
    db.commit()
    db.refresh(assessment)
    return _assessment_payload(db, assessment)


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: UUID, current_user: CurrentUser, db: DbSession):
    assessment = (
        db.query(Assessment)
        .options(joinedload(Assessment.user_plant))
        .filter(Assessment.id == assessment_id)
        .one_or_none()
    )
    if assessment is None or assessment.user_plant.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )
    return _assessment_payload(db, assessment)
