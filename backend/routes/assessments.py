from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from data.seed_questionnaire import ensure_questionnaire
from database.connection import get_db
from database.models.assessment import Assessment
from database.models.assessment_answer import AssessmentAnswer
from database.models.feedback import Feedback
from database.models.plant_experience import PlantExperience
from database.models.plant_species import PlantSpecies
from database.models.plant_symptom import PlantSymptom
from database.models.question import Question
from database.models.user import User
from database.models.user_plant import UserPlant
from schemas.assessments import (
    AssessmentCreate,
    AssessmentHistoryItem,
    AssessmentHistoryPage,
    AssessmentResponse,
    ExplanationResponse,
    FeedbackCreate,
    FeedbackResponse,
    GuidanceResponse,
    PersonalizationResponse,
    PlantAnalyticsResponse,
    NextQuestionResponse,
    AnswerSubmission,
)

from services import explanation_service
from services.assessment_engine import evaluate, status_for_score
from services.personalization_service import build_context
from services.recommendation_service import build_guidance
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


def _assessment_result(db: Session, assessment: Assessment, rows: list) -> dict | None:
    """Deterministically evaluate stored answers against curated knowledge."""
    plant = (
        db.query(UserPlant)
        .filter(UserPlant.id == assessment.user_plant_id)
        .one_or_none()
    )
    if plant is None or plant.plant_species_id is None:
        return None
    species = db.get(PlantSpecies, plant.plant_species_id)
    if species is None:
        return None
    symptoms = (
        db.query(PlantSymptom)
        .filter(PlantSymptom.plant_species_id == species.id)
        .all()
    )
    feature_map = {}
    for answer, question in rows:
        if question is not None and question.maps_to_feature:
            feature_map[question.maps_to_feature] = answer.answer_value
    return evaluate(species, symptoms, feature_map)


def _stored_or_computed_result(db: Session, assessment: Assessment, rows: list) -> dict | None:
    """Historical assessments return their immutable snapshot.

    Rows created before the snapshot column existed are evaluated once from
    current knowledge and backfilled, so later knowledge changes can never
    alter an already-served historical result.
    """
    if isinstance(assessment.result, dict) and assessment.result.get("health_score") is not None:
        return assessment.result
    result = _assessment_result(db, assessment, rows)
    if result is not None:
        assessment.result = result
        db.commit()
        db.refresh(assessment)
    return result


def _history_item(assessment: Assessment, plant: UserPlant) -> AssessmentHistoryItem:
    species = plant.plant_species
    snapshot = assessment.result if isinstance(assessment.result, dict) else None
    score = assessment.health_score
    if snapshot is not None and snapshot.get("health_score") is not None:
        score = snapshot["health_score"]
        status_value = snapshot.get("health_status") or status_for_score(score)
    elif score is not None:
        status_value = status_for_score(score)
    else:
        status_value = None
    return AssessmentHistoryItem(
        id=assessment.id,
        user_plant_id=assessment.user_plant_id,
        nickname=plant.nickname,
        common_name=species.common_name if species is not None else None,
        scientific_name=species.scientific_name if species is not None else None,
        health_score=score,
        health_status=status_value,
        confidence=assessment.confidence,
        created_at=assessment.created_at,
    )


def _assessment_payload(
    db: Session, assessment: Assessment, user: User | None = None
) -> AssessmentResponse:
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
    result = _stored_or_computed_result(db, assessment, rows)
    personalization = _current_personalization(db, user, assessment)
    return AssessmentResponse(
        id=assessment.id,
        user_plant_id=assessment.user_plant_id,
        questionnaire_id=questionnaire_id,
        questionnaire_version=questionnaire_version,
        created_at=assessment.created_at,
        answers=answers,
        result=result,
        personalization=personalization,
        guidance=_assessment_guidance(db, assessment, user, result, personalization),
    )


def _assessment_guidance(db, assessment, user, result, personalization):
    """Current-context enriched guidance. Deterministic; never stored in the
    frozen snapshot and never affecting historical scores."""
    if result is None:
        return None
    plant = (
        db.query(UserPlant)
        .options(joinedload(UserPlant.plant_species))
        .filter(UserPlant.id == assessment.user_plant_id)
        .one_or_none()
    )
    if plant is None:
        return None
    preferences = {}
    if user is not None:
        preferences = {
            "experience_level": user.experience_level,
            "care_preference": user.care_preference,
        }

    # Deterministic historical comparison against previous assessment if one exists
    historical_comparison = None
    prev_assessment = (
        db.query(Assessment)
        .filter(
            Assessment.user_plant_id == plant.id,
            Assessment.id != assessment.id,
            Assessment.created_at < assessment.created_at,
        )
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if prev_assessment and prev_assessment.health_score is not None and result.get("health_score") is not None:
        prev_score = int(round(prev_assessment.health_score))
        curr_score = result.get("health_score")
        if curr_score > prev_score:
            trend = "improving"
            delta = int(round(curr_score - prev_score))
            summary = f"Health score increased by {delta} points since previous assessment."
        elif curr_score < prev_score:
            trend = "worsening"
            delta = int(round(prev_score - curr_score))
            summary = f"Health score decreased by {delta} points since previous assessment."
        else:
            trend = "unchanged"
            summary = "Health score is unchanged since previous assessment."

        historical_comparison = {
            "previous_score": prev_score,
            "previous_status": prev_assessment.result.get("health_status") if isinstance(prev_assessment.result, dict) else None,
            "trend": trend,
            "summary": summary,
        }

    return build_guidance(result, plant.plant_species, personalization, preferences, historical_comparison=historical_comparison)



def _current_personalization(
    db: Session, user: User | None, assessment: Assessment
) -> dict | None:
    """Current-context personalization (NOT part of the frozen result).

    Built from prior assessments excluding this one, so viewing history never
    changes what is shown, only adds present-day context around it.
    """
    if user is None:
        return None
    plant = (
        db.query(UserPlant)
        .filter(
            UserPlant.id == assessment.user_plant_id,
            UserPlant.user_id == user.id,
        )
        .one_or_none()
    )
    if plant is None:
        return None
    return _personalization_for_plant(db, user, plant, exclude_assessment_id=assessment.id)


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
    db.flush()
    stored_rows = (
        db.query(AssessmentAnswer, Question)
        .outerjoin(Question, AssessmentAnswer.question_id == Question.id)
        .filter(AssessmentAnswer.assessment_id == assessment.id)
        .all()
    )
    engine_result = _assessment_result(db, assessment, stored_rows)
    if engine_result is not None:
        # Persisted for future retrieval; normalized answer rows remain the
        # source of truth. ML columns stay NULL: no model runs in this phase.
        assessment.health_score = engine_result["health_score"]
        assessment.confidence = engine_result["confidence"]
        assessment.answers = {
            question.maps_to_feature: answer.answer_value
            for answer, question in stored_rows
            if question is not None and question.maps_to_feature
        }
        assessment.recommendations = engine_result["recommendations"]
        assessment.result = engine_result
    db.commit()
    db.refresh(assessment)
    return _assessment_payload(db, assessment, current_user)

@router.get("/{plant_id}/next-question", response_model=NextQuestionResponse)
def get_next_question(plant_id: UUID, current_user: CurrentUser, db: DbSession):
    plant = _owned_plant(db, plant_id, current_user.id)
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_plant_id == plant_id, Assessment.status == "in_progress")
        .one_or_none()
    )
    if assessment is None:
        assessment = Assessment(user_plant_id=plant_id, status="in_progress", contract_version=1)
        db.add(assessment)
        db.flush()
    from services.question_engine import QuestionEngine
    from datetime import datetime
    engine = QuestionEngine(db)
    next_q = engine.get_next_question(plant, assessment)
    answered = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment.id).count()
    if next_q is None:
        assessment.status = "completed"
        assessment.submitted_at = datetime.utcnow()
        stored_rows = (
            db.query(AssessmentAnswer, Question)
            .outerjoin(Question, AssessmentAnswer.question_id == Question.id)
            .filter(AssessmentAnswer.assessment_id == assessment.id)
            .all()
        )
        engine_result = _assessment_result(db, assessment, stored_rows)
        if engine_result:
            assessment.health_score = engine_result["health_score"]
            assessment.confidence = engine_result["confidence"]
            assessment.answers = {
                q.maps_to_feature: a.answer_value
                for a, q in stored_rows
                if q is not None and q.maps_to_feature
            }
            assessment.recommendations = engine_result.get("recommendations")
            assessment.result = engine_result
        db.commit()
        db.refresh(assessment)
        return NextQuestionResponse(question=None, progress=answered, total_estimated=None)
    q_dict = {
        "id": next_q.id,
        "question_text": next_q.question_text,
        "question_type": next_q.question_type,
        "question_order": next_q.question_order,
        "is_required": next_q.is_required,
        "options": next_q.options,
        "maps_to_feature": next_q.maps_to_feature,
    }
    return NextQuestionResponse(question=q_dict, progress=answered, total_estimated=None)


@router.post("/{plant_id}/answers", response_model=NextQuestionResponse)
def submit_answer(plant_id: UUID, payload: AnswerSubmission, current_user: CurrentUser, db: DbSession):
    plant = _owned_plant(db, plant_id, current_user.id)
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_plant_id == plant_id, Assessment.status == "in_progress")
        .one_or_none()
    )
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="In-progress assessment not found.")
    question = db.query(Question).filter(Question.id == payload.question_id).one_or_none()
    if question is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown question.")
    
    db.add(AssessmentAnswer(assessment_id=assessment.id, question_id=payload.question_id, answer_value=payload.value))
    db.flush()
    from datetime import datetime
    if payload.finalize:
        assessment.status = "completed"
        assessment.submitted_at = datetime.utcnow()
    from services.question_engine import QuestionEngine
    engine = QuestionEngine(db)
    next_q = engine.get_next_question(plant, assessment)
    answered = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment.id).count()
    if next_q is None:
        assessment.status = "completed"
        assessment.submitted_at = datetime.utcnow()
        stored_rows = (
            db.query(AssessmentAnswer, Question)
            .outerjoin(Question, AssessmentAnswer.question_id == Question.id)
            .filter(AssessmentAnswer.assessment_id == assessment.id)
            .all()
        )
        engine_result = _assessment_result(db, assessment, stored_rows)
        if engine_result:
            assessment.health_score = engine_result["health_score"]
            assessment.confidence = engine_result["confidence"]
            assessment.answers = {
                q.maps_to_feature: a.answer_value
                for a, q in stored_rows
                if q is not None and q.maps_to_feature
            }
            assessment.recommendations = engine_result.get("recommendations")
            assessment.result = engine_result
        db.commit()
        db.refresh(assessment)
        return NextQuestionResponse(question=None, progress=answered, total_estimated=None)
    q_dict = {
        "id": next_q.id,
        "question_text": next_q.question_text,
        "question_type": next_q.question_type,
        "question_order": next_q.question_order,
        "is_required": next_q.is_required,
        "options": next_q.options,
        "maps_to_feature": next_q.maps_to_feature,
    }
    return NextQuestionResponse(question=q_dict, progress=answered, total_estimated=None)


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
    return _assessment_payload(db, assessment, current_user)


def _owned_assessment(db: Session, assessment_id: UUID, user_id: UUID) -> Assessment:
    assessment = (
        db.query(Assessment)
        .options(joinedload(Assessment.user_plant))
        .filter(Assessment.id == assessment_id)
        .one_or_none()
    )
    if assessment is None or assessment.user_plant.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )
    return assessment


def _personalization_for_plant(
    db: Session, user: User, plant: UserPlant, exclude_assessment_id: UUID | None = None
) -> dict:
    """Evidence-based context for one plant: priors exclude the current assessment."""
    plant_rows = (
        db.query(Assessment)
        .filter(Assessment.user_plant_id == plant.id)
        .order_by(Assessment.created_at.asc(), Assessment.id.asc())
        .all()
    )
    if exclude_assessment_id is not None:
        plant_rows = [a for a in plant_rows if str(a.id) != str(exclude_assessment_id)]
    prior_results = [a.result for a in plant_rows if isinstance(a.result, dict)]

    user_rows = (
        db.query(Assessment)
        .join(UserPlant, Assessment.user_plant_id == UserPlant.id)
        .filter(UserPlant.user_id == user.id)
        .order_by(Assessment.created_at.desc(), Assessment.id.desc())
        .limit(200)
        .all()
    )
    user_assessment_ids = [a.id for a in user_rows]
    feedbacks = (
        db.query(Feedback)
        .filter(Feedback.assessment_id.in_(user_assessment_ids))
        .all()
        if user_assessment_ids
        else []
    )
    plant_ids = {a.id for a in plant_rows}
    plant_feedbacks = [f for f in feedbacks if f.assessment_id in plant_ids]
    return build_context(
        plant.nickname,
        prior_results,
        plant_feedbacks,
        [a.result for a in user_rows if isinstance(a.result, dict)],
        feedbacks,
        {"experience_level": user.experience_level, "care_preference": user.care_preference},
    )


def _record_experience(db: Session, plant: UserPlant, helpfulness: str) -> None:
    """Aggregate-only experience signal. Never mutates plant knowledge and never
    treats one user's feedback as universal truth — counters only."""
    if plant.plant_species_id is None:
        return
    row = (
        db.query(PlantExperience)
        .filter(
            PlantExperience.plant_species_id == plant.plant_species_id,
            PlantExperience.condition == f"feedback:{helpfulness}",
            PlantExperience.recommendation_type == "phase7_assessment",
        )
        .one_or_none()
    )
    if row is None:
        row = PlantExperience(
            plant_species_id=plant.plant_species_id,
            condition=f"feedback:{helpfulness}",
            recommendation_type="phase7_assessment",
            observed_outcome=helpfulness,
            sample_count=0,
            success_count=0,
            confidence_score=0.0,
        )
        db.add(row)
    row.sample_count += 1
    if helpfulness == "helpful":
        row.success_count += 1
    row.confidence_score = row.success_count / row.sample_count if row.sample_count else 0.0


def _history_query(db: Session, user_id: UUID, plant_id: UUID | None = None):
    query = (
        db.query(Assessment)
        .join(UserPlant, Assessment.user_plant_id == UserPlant.id)
        .options(joinedload(Assessment.user_plant).joinedload(UserPlant.plant_species))
        .filter(UserPlant.user_id == user_id)
    )
    if plant_id is not None:
        query = query.filter(UserPlant.id == plant_id)
    return query.order_by(Assessment.created_at.desc(), Assessment.id.desc())


@router.get("", response_model=AssessmentHistoryPage)
def list_assessments(
    current_user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    query = _history_query(db, current_user.id)
    total = query.count()
    rows = query.offset(offset).limit(limit).all()
    return AssessmentHistoryPage(
        items=[_history_item(a, a.user_plant) for a in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/garden/{plant_id}/assessments", response_model=AssessmentHistoryPage)
def list_plant_assessments(
    plant_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    _owned_plant(db, plant_id, current_user.id)
    query = _history_query(db, current_user.id, plant_id)
    total = query.count()
    rows = query.offset(offset).limit(limit).all()
    return AssessmentHistoryPage(
        items=[_history_item(a, a.user_plant) for a in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/garden/{plant_id}/analytics", response_model=PlantAnalyticsResponse)
def get_plant_analytics(plant_id: UUID, current_user: CurrentUser, db: DbSession):
    plant = _owned_plant(db, plant_id, current_user.id)
    rows = (
        db.query(Assessment)
        .join(UserPlant, Assessment.user_plant_id == UserPlant.id)
        .filter(UserPlant.id == plant_id, UserPlant.user_id == current_user.id)
        .order_by(Assessment.created_at.asc(), Assessment.id.asc())
        .all()
    )
    species = plant.plant_species
    scores = [a.health_score for a in rows if a.health_score is not None]
    statuses = [
        (a.result.get("health_status") if isinstance(a.result, dict) else None)
        or (status_for_score(a.health_score) if a.health_score is not None else None)
        for a in rows
    ]
    counts = {"healthy": 0, "needs_attention": 0, "critical": 0}
    for value in statuses:
        key = str(value).lower().replace(" ", "_") if value else None
        if key in counts:
            counts[key] += 1
    if scores:
        latest, previous = scores[-1], scores[-2] if len(scores) > 1 else None
        summary = {
            "assessment_count": len(rows),
            "latest_score": latest,
            "previous_score": previous,
            "score_change": (latest - previous) if previous is not None else None,
            "average_score": round(sum(scores) / len(scores), 1),
            "highest_score": max(scores),
            "lowest_score": min(scores),
        }
    else:
        summary = {
            "assessment_count": 0,
            "latest_score": None,
            "previous_score": None,
            "score_change": None,
            "average_score": None,
            "highest_score": None,
            "lowest_score": None,
        }
    return PlantAnalyticsResponse(
        plant={
            "id": plant.id,
            "nickname": plant.nickname,
            "common_name": species.common_name if species is not None else None,
            "scientific_name": species.scientific_name if species is not None else None,
        },
        summary=summary,
        status_counts=counts,
        timeline=[
            {
                "assessment_id": a.id,
                "date": a.created_at,
                "score": a.health_score,
                "status": s,
            }
            for a, s in zip(rows, statuses)
        ],
    )


def _feedback_payload(row: Feedback) -> FeedbackResponse:
    return FeedbackResponse(
        id=row.id,
        assessment_id=row.assessment_id,
        helpfulness=row.helpfulness,
        reasons=list(row.reasons or []),
        created_at=row.created_at,
    )


@router.post("/{assessment_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(assessment_id: UUID, payload: FeedbackCreate, current_user: CurrentUser, db: DbSession):
    """Create or update the caller's feedback for one owned assessment.

    One feedback record per assessment (latest submission wins); resubmission
    updates the same row instead of creating duplicates.
    """
    assessment = _owned_assessment(db, assessment_id, current_user.id)
    row = (
        db.query(Feedback)
        .filter(Feedback.assessment_id == assessment.id)
        .one_or_none()
    )
    if row is None:
        row = Feedback(assessment_id=assessment.id, user_id=current_user.id)
        db.add(row)
    row.user_id = current_user.id
    row.helpfulness = payload.helpfulness
    row.helpful = payload.helpfulness == "helpful"
    row.reasons = list(payload.reasons)
    db.flush()
    _record_experience(db, assessment.user_plant, payload.helpfulness)
    db.commit()
    db.refresh(row)
    return _feedback_payload(row)


@router.get("/{assessment_id}/feedback", response_model=FeedbackResponse)
def get_feedback(assessment_id: UUID, current_user: CurrentUser, db: DbSession):
    assessment = _owned_assessment(db, assessment_id, current_user.id)
    row = (
        db.query(Feedback)
        .filter(Feedback.assessment_id == assessment.id)
        .one_or_none()
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No feedback submitted for this assessment yet.",
        )
    return _feedback_payload(row)


@router.get("/garden/{plant_id}/personalization", response_model=PersonalizationResponse)
def get_personalization(plant_id: UUID, current_user: CurrentUser, db: DbSession):
    plant = _owned_plant(db, plant_id, current_user.id)
    return _personalization_for_plant(db, current_user, plant)


@router.post("/{assessment_id}/explanation", response_model=ExplanationResponse)
def get_explanation(assessment_id: UUID, current_user: CurrentUser, db: DbSession):
    """Generate (once) and cache an AI explanation for an owned assessment.

    The deterministic result snapshot is never modified; the explanation is
    stored separately in `ai_explanation`. Gemini failures never fail the
    request — they return `available: False` with a generic message.
    """
    assessment = _owned_assessment(db, assessment_id, current_user.id)
    if assessment.ai_explanation:
        return ExplanationResponse(
            assessment_id=assessment.id, available=True, cached=True,
            explanation=assessment.ai_explanation,
        )
    plant = assessment.user_plant
    species = plant.plant_species if plant is not None else None
    rows = (
        db.query(AssessmentAnswer, Question)
        .outerjoin(Question, AssessmentAnswer.question_id == Question.id)
        .filter(AssessmentAnswer.assessment_id == assessment.id)
        .all()
    )
    result = _stored_or_computed_result(db, assessment, rows)
    personalization = _current_personalization(db, current_user, assessment)
    guidance = _assessment_guidance(db, assessment, current_user, result, personalization)
    facts = {}
    if species is not None:
        facts = {
            "common_name": species.common_name,
            "scientific_name": species.scientific_name,
            "category": species.category,
            "difficulty": species.difficulty,
            "light_requirement": species.light_requirement,
            "preferred_soil_types": species.preferred_soil_types,
            "drought_tolerance": species.drought_tolerance,
            "overwatering_sensitivity": species.overwatering_sensitivity,
            "description": species.description,
        }
    notes = (guidance or {}).get("personalization_notes", []) if isinstance(guidance, dict) else []
    outcome = explanation_service.explain_assessment(
        plant.nickname if plant is not None else "your plant",
        facts,
        result or {},
        notes,
        {"experience_level": current_user.experience_level,
         "care_preference": current_user.care_preference},
    )
    if outcome["available"]:
        assessment.ai_explanation = outcome["text"]
        db.commit()
        return ExplanationResponse(
            assessment_id=assessment.id, available=True, cached=False,
            explanation=outcome["text"],
        )
    return ExplanationResponse(
        assessment_id=assessment.id, available=False, cached=False,
        message=outcome["reason"],
    )
