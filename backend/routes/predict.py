from fastapi import APIRouter, HTTPException
import logging
from typing import List
from pydantic import BaseModel

from services.ml_service import ml_service
from services.history_service import history_service
from utils.plant_helpers import preprocess_input, map_recommendations
from utils.validation import validate_supported_plants

logger = logging.getLogger(__name__)

router = APIRouter()

class PlantInput(BaseModel):
    name: str
    water: str
    sunlight: str
    color: str
    soil: str

class BatchPlantInput(BaseModel):
    plants: List[PlantInput]

class PlantResult(BaseModel):
    plant: str
    watering: str
    sunlight: str
    fertilizer: str
    health: str
    confidence: str

class BatchPlantOutput(BaseModel):
    results: List[PlantResult]

@router.post("/predict", response_model=BatchPlantOutput, tags=["Prediction"])
def predict(batch: BatchPlantInput):
    # 1. Validation Logic
    validate_supported_plants(batch.plants)
    
    if not ml_service.is_loaded():
        logger.error("Prediction attempted, but models are not loaded.")
        raise HTTPException(status_code=503, detail="Model pipeline is not generated.")

    try:
        logger.info(f"Received batch prediction request for {len(batch.plants)} plants")
        
        batch_results = []
        for p in batch.plants:
            features = preprocess_input(p.model_dump())

            water_needed, health_score = ml_service.predict(features)
            
            recs = map_recommendations(water_needed, health_score, features, p.color, p.name)
            
            # Confidence logic (simple simulated heuristic based on regressor stability boundaries)
            confidence = "High" if 30 <= health_score <= 85 else "Moderate"

            # Contextualize predictions through history scanning (Adaptive Learning)
            recs = history_service.contextualize_prediction(p.name, p.water, recs)

            batch_results.append(PlantResult(
                plant=recs['plant'],
                watering=recs['watering'],
                sunlight=recs['sunlight'],
                fertilizer=recs['fertilizer'],
                health=recs['health'],
                confidence=confidence
            ))

        output = BatchPlantOutput(results=batch_results)
        
        # Save explicitly formatted output to local data (safely wrapped)
        try:
            history_service.save_batch(batch.model_dump(), output.model_dump())
        except Exception as file_err:
            logger.error(f"Failed to persist batch history: {str(file_err)}")
        
        return output

    except Exception as e:
        logger.exception("Error during batch prediction processing")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
