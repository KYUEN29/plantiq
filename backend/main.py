import json
import random
import joblib
import numpy as np
import pandas as pd
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── Paths (resolve relative to this file) ─────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent
MODEL_DIR  = BASE_DIR / "model"

# ── Load models once at startup ───────────────────────────────────────────────
try:
    # Instead of raw models + scaler + hardcoded features, we load the Pipeline
    clf_pipeline = joblib.load(MODEL_DIR / "rf_classifier_v2.joblib")
    reg_pipeline = joblib.load(MODEL_DIR / "rf_regressor_v2.joblib")
    with open(MODEL_DIR / "model_meta_v2.json") as f:
        meta = json.load(f)
    logger.info("✅ Models and Pipelines V2 loaded successfully")
except FileNotFoundError:
    logger.error("⚠️ Models not found. Run python ml_pipeline_advanced.py first!")
    clf_pipeline, reg_pipeline, meta = None, None, None

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="🌿 Smart Plant Monitoring API V2",
    description="AI-powered plant health prediction using Random Forest pipelines",
    version="2.0.0",
)

# Allow all origins so the HTML frontend can call the API locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / response schemas ────────────────────────────────────────────────
class PlantInput(BaseModel):
    plant_name: str
    watering_frequency: str
    sunlight: str
    plant_color: str
    soil_condition: str
    location: str

class PlantOutput(BaseModel):
    watering: str
    sunlight: str
    fertilizer: str
    health_status: str

# ── Preprocessing Logic ───────────────────────────────────────────────────────
def preprocess_input(data: PlantInput) -> dict:
    # 1. plant_type
    known_plants = ['Cactus', 'Snake Plant', 'Money Plant', 'Peace Lily', 'Fern']
    plant_type = data.plant_name if data.plant_name in known_plants else 'Fern'

    # 2. watering_frequency qualitative to numeric
    wf_map = {
        "Daily": 1.0,
        "Every 2-3 days": 2.5,
        "Weekly": 7.0
    }
    wf = wf_map.get(data.watering_frequency, 3.0)

    # 3. sunlight -> sunlight_hours & light
    sun_map = {
        "Full sunlight": (8.0, 800.0),
        "Partial sunlight": (4.0, 400.0),
        "Low light": (2.0, 150.0)
    }
    sh, light = sun_map.get(data.sunlight, (5.0, 500.0))

    # 4. soil_condition -> moisture
    moist_map = {
        "Moist": 70.0,
        "Dry": 20.0,
        "Overwatered": 95.0
    }
    moisture = moist_map.get(data.soil_condition, 50.0)

    # 5. location -> temperature & humidity
    loc_map = {
        "Indoor": (22.0, 45.0),
        "Balcony": (26.0, 60.0),
        "Outdoor garden": (30.0, 65.0)
    }
    temp, humidity = loc_map.get(data.location, (24.0, 50.0))
    
    # Defaults for other required features
    soil_type = "loamy"
    pot_size = "medium"
    growth_stage = "mature"
    time_since_last_water = wf * 12 # estimate in hours
    
    return {
        "plant_type": plant_type,
        "soil_type": soil_type,
        "pot_size": pot_size,
        "growth_stage": growth_stage,
        "moisture": moisture,
        "temperature": temp,
        "humidity": humidity,
        "light": light,
        "sunlight_hours": sh,
        "time_since_last_water": time_since_last_water,
        "watering_frequency": wf
    }

# ── Helper: map qualitative responses ─────────────────────────────────────────
def map_recommendations(water_needed: int, health_score: float, features: dict, color: str) -> dict:
    # Watering
    if water_needed == 1 or features["moisture"] < 30:
        watering = "Water immediately, then every 2-3 days."
    elif features["moisture"] > 80:
        watering = "Stop watering. Let soil dry out for a week."
    else:
        watering = "Maintain current watering schedule."

    # Sunlight
    if features["sunlight_hours"] < 4:
        sunlight = "Move to a brighter spot (indirect sunlight)."
    elif features["sunlight_hours"] > 7 and features["temperature"] > 30:
        sunlight = "Move to partial shade to avoid sunburn."
    else:
        sunlight = "Current sunlight exposure is optimal."

    # Fertilizer & Generic Health based on Color / Score
    if color == "Healthy green" and health_score > 70:
        fertilizer = "Use standard liquid fertilizer once a month."
        health_status = "Healthy"
    elif color == "Slightly yellow":
        fertilizer = "Use nitrogen-rich fertilizer weekly to restore color."
        health_status = "Warning (Nutrient Deficiency?)"
    elif color == "Brown/dry" or health_score < 50:
        fertilizer = "Avoid fertilizer until plant recovers. Focus on hydration."
        health_status = "Critical (Needs Attention)"
    else:
        if health_score < 70:
            health_status = "Warning"
            fertilizer = "Use a balanced fertilizer bi-weekly."
        else:
            health_status = "Healthy"
            fertilizer = "Standard organic compost monthly."

    if features["moisture"] > 90 and color != "Healthy green":
         health_status = "Overwatered (Risk of Root Rot)"

    return {
        "watering": watering,
        "sunlight": sunlight,
        "fertilizer": fertilizer,
        "health_status": health_status
    }

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "🌿 Smart Plant Monitoring API V2 is running!",
        "model_loaded": clf_pipeline is not None
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Standard health check endpoint for deployment monitoring."""
    if clf_pipeline is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    return {"status": "ok", "message": "Service is healthy"}

@app.post("/predict", response_model=PlantOutput, tags=["Prediction"])
def predict(data: PlantInput):
    """
    Predict plant health from qualitative user questions.
    """
    if clf_pipeline is None:
        logger.error("Prediction attempted, but models are not loaded.")
        raise HTTPException(status_code=503, detail="Model pipeline is not generated. Run python ml_pipeline_advanced.py")

    try:
        logger.info(f"Received prediction request for plant: {data.plant_name}")
        # Preprocess qualitative to quantitative
        features = preprocess_input(data)
        df_input = pd.DataFrame([features])

        # Pipeline handles all the transformations and predictions!
        water_needed = int(clf_pipeline.predict(df_input)[0])
        health_score = float(np.clip(reg_pipeline.predict(df_input)[0], 0, 100))
        
        recs = map_recommendations(water_needed, health_score, features, data.plant_color)

        logger.info(f"Prediction successful -> Health Score: {health_score:.1f}, Status: {recs['health_status']}")
        return PlantOutput(
            watering      = recs["watering"],
            sunlight      = recs["sunlight"],
            fertilizer    = recs["fertilizer"],
            health_status = recs["health_status"]
        )

    except Exception as e:
        logger.exception("Error during prediction processing")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
