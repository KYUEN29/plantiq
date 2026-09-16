"""Canonical Phase 5 questionnaire definition.

Single source of truth for the 10 core Random-Forest-aligned questions plus
the plant-condition (symptoms) question. Each option carries a display label
for the UI and a normalized machine-readable value used for storage and for
Phase 6 feature mapping. Display labels are never used as the data contract.
"""

QUESTIONNAIRE_VERSION = "1.0"


def _opt(label, value):
    return {"label": label, "value": value}


QUESTION_DEFINITIONS = [
    {
        "question_text": "When was your plant last watered?",
        "question_type": "single_choice",
        "question_order": 1,
        "is_required": True,
        "maps_to_feature": "time_since_last_water",
        "options": [
            _opt("Today", "today"),
            _opt("Yesterday", "yesterday"),
            _opt("2–3 days ago", "2_3_days"),
            _opt("4–7 days ago", "4_7_days"),
            _opt("More than a week ago", "over_week"),
            _opt("I don't remember", "unknown"),
        ],
    },
    {
        "question_text": "How often do you usually water this plant?",
        "question_type": "single_choice",
        "question_order": 2,
        "is_required": True,
        "maps_to_feature": "watering_frequency",
        "options": [
            _opt("Daily", "daily"),
            _opt("Every 2–3 days", "every_2_3_days"),
            _opt("Once a week", "weekly"),
            _opt("Every 1–2 weeks", "every_1_2_weeks"),
            _opt("Less often", "less_often"),
            _opt("No fixed routine", "no_routine"),
        ],
    },
    {
        "question_text": "How does the soil currently feel?",
        "question_type": "single_choice",
        "question_order": 3,
        "is_required": True,
        "maps_to_feature": "moisture",
        "options": [
            _opt("Very dry", "very_dry"),
            _opt("Slightly dry", "slightly_dry"),
            _opt("Moist", "moist"),
            _opt("Very moist", "very_moist"),
            _opt("Waterlogged", "waterlogged"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "Approximately how many hours of direct/bright sunlight does the plant receive per day?",
        "question_type": "single_choice",
        "question_order": 4,
        "is_required": True,
        "maps_to_feature": "sunlight_hours",
        "options": [
            _opt("Less than 2 hours", "lt_2h"),
            _opt("2–4 hours", "2_4h"),
            _opt("4–6 hours", "4_6h"),
            _opt("6–8 hours", "6_8h"),
            _opt("More than 8 hours", "gt_8h"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "What kind of light does your plant usually receive?",
        "question_type": "single_choice",
        "question_order": 5,
        "is_required": True,
        "maps_to_feature": "light",
        "options": [
            _opt("Low light", "low"),
            _opt("Indirect light", "indirect"),
            _opt("Bright indirect light", "bright_indirect"),
            _opt("Direct sunlight", "direct"),
            _opt("Mixed/varies", "mixed"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "What type of soil is your plant growing in?",
        "question_type": "single_choice",
        "question_order": 6,
        "is_required": True,
        "maps_to_feature": "soil_type",
        "options": [
            _opt("Regular potting soil", "regular_potting"),
            _opt("Well-draining potting mix", "well_draining_mix"),
            _opt("Succulent/cactus mix", "succulent_cactus_mix"),
            _opt("Garden soil", "garden_soil"),
            _opt("Cocopeat/coir-based mix", "cocopeat_coir"),
            _opt("Other", "other"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "How would you describe the pot size compared with the plant?",
        "question_type": "single_choice",
        "question_order": 7,
        "is_required": True,
        "maps_to_feature": "pot_size",
        "options": [
            _opt("Very small", "very_small"),
            _opt("Slightly small", "slightly_small"),
            _opt("Appropriate", "appropriate"),
            _opt("Large", "large"),
            _opt("Very large", "very_large"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "What is the current growth stage of your plant?",
        "question_type": "single_choice",
        "question_order": 8,
        "is_required": True,
        "maps_to_feature": "growth_stage",
        "options": [
            _opt("Young/seedling", "seedling"),
            _opt("Growing/juvenile", "juvenile"),
            _opt("Mature", "mature"),
            _opt("Flowering", "flowering"),
            _opt("Fruiting", "fruiting"),
            _opt("Dormant", "dormant"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "What is the approximate temperature around your plant?",
        "question_type": "single_choice",
        "question_order": 9,
        "is_required": True,
        "maps_to_feature": "temperature",
        "options": [
            _opt("Below 15°C", "lt_15c"),
            _opt("15–20°C", "15_20c"),
            _opt("20–25°C", "20_25c"),
            _opt("25–30°C", "25_30c"),
            _opt("30–35°C", "30_35c"),
            _opt("Above 35°C", "gt_35c"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "What is the approximate humidity around your plant?",
        "question_type": "single_choice",
        "question_order": 10,
        "is_required": True,
        "maps_to_feature": "humidity",
        "options": [
            _opt("Very dry", "very_dry"),
            _opt("Dry", "dry"),
            _opt("Moderate", "moderate"),
            _opt("Humid", "humid"),
            _opt("Very humid", "very_humid"),
            _opt("I'm not sure", "unknown"),
        ],
    },
    {
        "question_text": "What is the main issue you are noticing with your plant right now?",
        "question_type": "single_choice",
        "question_order": 11,
        "is_required": True,
        "maps_to_feature": "symptoms",
        "options": [
            _opt("Healthy", "healthy"),
            _opt("Yellow leaves", "yellow_leaves"),
            _opt("Brown leaf tips", "brown_tips"),
            _opt("Wilting", "wilting"),
            _opt("Brown spots", "brown_spots"),
            _opt("Leaf spots", "leaf_spots"),
            _opt("Leaf drop", "leaf_drop"),
            _opt("Slow growth", "slow_growth"),
            _opt("White residue", "white_residue"),
            _opt("Insects/pests", "pests"),
            _opt("Other", "other"),
        ],
    }
]
