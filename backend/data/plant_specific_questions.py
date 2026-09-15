"""Plant-specific extra question definitions for adaptive assessment.

Mapping of plant categories (lowercase) to a list of question dicts. Each dict follows
the same schema as core questionnaire entries and will be persisted on‑the‑fly by
`QuestionEngine` when needed.
"""

PLANT_SPECIFIC_QUESTIONS = {
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
                {"label": "Often", "value": "often"}
            ]
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
                {"label": "Never", "value": "never"}
            ]
        }
    ]
}
