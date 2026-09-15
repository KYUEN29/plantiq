"""Idempotently seed the Phase 5 global questionnaire and its questions.

Run from ``backend``: ``python -m data.seed_questionnaire``.
The questionnaire is global (plant_species_id NULL) so the same dynamic
question set serves every garden plant; plant-specific knowledge continues
to come from the plant_species catalogue.
"""

from data.questionnaire_definitions import QUESTION_DEFINITIONS, QUESTIONNAIRE_VERSION
from database.connection import SessionLocal
from database.models.question import Question
from database.models.questionnaire import Questionnaire


def ensure_questionnaire(session):
    """Return the active global questionnaire, creating/refreshing as needed."""
    questionnaire = (
        session.query(Questionnaire)
        .filter(
            Questionnaire.plant_species_id.is_(None),
            Questionnaire.version == QUESTIONNAIRE_VERSION,
            Questionnaire.is_active.is_(True),
        )
        .one_or_none()
    )
    if questionnaire is None:
        questionnaire = Questionnaire(
            plant_species_id=None,
            version=QUESTIONNAIRE_VERSION,
            is_active=True,
        )
        session.add(questionnaire)
        session.flush()

    existing = (
        session.query(Question)
        .filter(Question.questionnaire_id == questionnaire.id)
        .all()
    )
    by_feature = {q.maps_to_feature: q for q in existing}

    for definition in QUESTION_DEFINITIONS:
        question = by_feature.get(definition["maps_to_feature"])
        if question is None:
            session.add(Question(questionnaire_id=questionnaire.id, **definition))
        else:
            for key, value in definition.items():
                setattr(question, key, value)
    session.commit()
    session.refresh(questionnaire)
    return questionnaire


def main() -> None:
    session = SessionLocal()
    try:
        questionnaire = ensure_questionnaire(session)
        count = (
            session.query(Question)
            .filter(Question.questionnaire_id == questionnaire.id)
            .count()
        )
        print(f"Questionnaire {questionnaire.version} ready with {count} questions.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
