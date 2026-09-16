"""QuestionEngine provides deterministic next-question selection for adaptive assessments.
It builds on the global questionnaire definitions and adds plant‑specific and conditional
questions based on the user's plant and previously answered observations.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from database.models.assessment import Assessment
from database.models.assessment_answer import AssessmentAnswer
from database.models.question import Question
from database.models.user_plant import UserPlant
from database.models.plant_species import PlantSpecies
from data.seed_questionnaire import ensure_questionnaire

# Simple mapping of plant category to extra question definitions (question IDs will be
# generated on the fly for this example – in a real system they'd be persisted.
# For brevity we embed minimal extra question data here.
EXTRA_QUESTIONS_BY_CATEGORY = {
    "succulent": [
        {
            "question_text": "How often do you mist your succulent?",
            "question_type": "single_choice",
            "question_order": 101,
            "is_required": False,
            "maps_to_feature": "mist_frequency",
            "options": [
                {"label": "Never", "value": "never"},
                {"label": "Rarely", "value": "rarely"},
                {"label": "Often", "value": "often"},
            ],
        }
    ],
    "herb": [
        {
            "question_text": "Do you harvest leaves regularly?",
            "question_type": "single_choice",
            "question_order": 102,
            "is_required": False,
            "maps_to_feature": "harvest_frequency",
            "options": [
                {"label": "Every week", "value": "weekly"},
                {"label": "Every few weeks", "value": "few_weeks"},
                {"label": "Never", "value": "never"},
            ],
        }
    ],
}

# Conditional follow‑up questions for specific symptoms.
FOLLOWUPS_BY_SYMPTOM = {
    "yellow_leaves": [
        {
            "question_text": "Do the yellow leaves appear on older growth?",
            "question_type": "single_choice",
            "question_order": 200,
            "is_required": True,
            "maps_to_feature": "yellow_old_growth",
            "options": [
                {"label": "Yes", "value": "yes"},
                {"label": "No", "value": "no"},
                {"label": "Not sure", "value": "unknown"},
            ],
        }
    ],
    "pests": [
        {
            "question_text": "What type of pest is affecting your plant most noticeably?",
            "question_type": "single_choice",
            "question_order": 201,
            "is_required": True,
            "maps_to_feature": "pest_types",
            "options": [
                {"label": "Aphids", "value": "aphids"},
                {"label": "Spider mites", "value": "spider_mites"},
                {"label": "Whiteflies", "value": "whiteflies"},
                {"label": "Other", "value": "other"},
            ],
        }
    ],
}

class QuestionEngine:
    """Deterministic engine to compute the next question for a given assessment.

    The engine is pure (no global mutable state) and returns the same question
    given identical inputs.
    """

    def __init__(self, db: Session):
        self.db = db

    def _answered_question_ids(self, assessment: Assessment) -> set:
        rows = (
            self.db.query(AssessmentAnswer.question_id)
            .filter(AssessmentAnswer.assessment_id == assessment.id)
            .all()
        )
        return {row[0] for row in rows if row[0] is not None}

    def _load_core_questions(self) -> List[Question]:
        questionnaire = ensure_questionnaire(self.db)
        return (
            self.db.query(Question)
            .filter(Question.questionnaire_id == questionnaire.id)
            .order_by(Question.question_order)
            .all()
        )

    def _plant_specific_questions(self, species: PlantSpecies) -> List[dict]:
        # Return extra question dicts based on species.category (case‑insensitive).
        cat = (species.category or "").lower()
        for key, extra in EXTRA_QUESTIONS_BY_CATEGORY.items():
            if key in cat:
                return extra
        return []

    def _symptom_followups(self, symptoms: List[str]) -> List[dict]:
        followups = []
        for s in symptoms:
            if s in FOLLOWUPS_BY_SYMPTOM:
                followups.extend(FOLLOWUPS_BY_SYMPTOM[s])
        return followups

    def _persist_extra_questions(self, extra_questions: List[dict], questionnaire_id: str) -> List[Question]:
        # Insert temporary extra questions into the DB if they don't already exist.
        created = []
        for qdef in extra_questions:
            existing = (
                self.db.query(Question)
                .filter(
                    Question.questionnaire_id == questionnaire_id,
                    Question.question_text == qdef["question_text"],
                )
                .one_or_none()
            )
            if existing:
                created.append(existing)
                continue
            q = Question(
                questionnaire_id=questionnaire_id,
                question_text=qdef["question_text"],
                question_type=qdef["question_type"],
                question_order=qdef["question_order"],
                is_required=qdef["is_required"],
                maps_to_feature=qdef.get("maps_to_feature"),
                options=qdef.get("options"),
            )
            self.db.add(q)
            self.db.flush()
            created.append(q)
        return created

    def get_next_question(self, user_plant: UserPlant, assessment: Assessment) -> Optional[Question]:
        """Return the next unanswered Question or ``None`` if the interview is complete.
        """
        answered_ids = self._answered_question_ids(assessment)
        core_questions = self._load_core_questions()
        # Gather plant‑specific and symptom follow‑up questions lazily.
        extra_questions_defs = []
        if user_plant.plant_species:
            extra_questions_defs.extend(self._plant_specific_questions(user_plant.plant_species))
        # Determine already captured symptom values.
        symptom_feature = "symptoms"
        symptom_answer = (
            self.db.query(AssessmentAnswer.answer_value)
            .join(Question, AssessmentAnswer.question_id == Question.id)
            .filter(
                AssessmentAnswer.assessment_id == assessment.id,
                Question.maps_to_feature == symptom_feature,
            )
            .scalar()
        )
        if symptom_answer:
            # symptom_answer may be a list (multi_choice) or string.
            if isinstance(symptom_answer, list):
                symptoms = symptom_answer
            else:
                symptoms = [symptom_answer]
            extra_questions_defs.extend(self._symptom_followups(symptoms))
        # Persist any extra questions that are not already in the questionnaire.
        questionnaire_id = core_questions[0].questionnaire_id if core_questions else None
        if extra_questions_defs and questionnaire_id:
            extra_q_objs = self._persist_extra_questions(extra_questions_defs, questionnaire_id)
        else:
            extra_q_objs = []
        # Combine core and extra, ordered by question_order.
        all_questions = sorted(core_questions + extra_q_objs, key=lambda q: q.question_order)
        for q in all_questions:
            if q.id not in answered_ids:
                return q
        return None
