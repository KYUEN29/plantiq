from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from data.seed_questionnaire import ensure_questionnaire
from database.connection import get_db
from database.models.question import Question
from database.models.user import User
from schemas.assessments import QuestionResponse, QuestionnaireResponse
from utils.auth_helpers import get_current_user


router = APIRouter(prefix="/questionnaires", tags=["Questionnaires"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _questionnaire_payload(db: Session) -> QuestionnaireResponse:
    questionnaire = ensure_questionnaire(db)
    questions = (
        db.query(Question)
        .filter(Question.questionnaire_id == questionnaire.id)
        .order_by(Question.question_order)
        .all()
    )
    return QuestionnaireResponse(
        id=questionnaire.id,
        version=questionnaire.version,
        questions=[
            {
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "question_order": q.question_order,
                "is_required": q.is_required,
                "options": q.options,
                "maps_to_feature": q.maps_to_feature,
            }
            for q in questions
        ],
    )


@router.get("/current", response_model=QuestionnaireResponse)
def get_current_questionnaire(current_user: CurrentUser, db: DbSession):
    return _questionnaire_payload(db)


@router.get("/current/questions", response_model=list[QuestionResponse])
def get_current_questions(current_user: CurrentUser, db: DbSession):
    return _questionnaire_payload(db).questions
