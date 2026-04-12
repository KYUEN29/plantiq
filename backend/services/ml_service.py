import json
import joblib
import numpy as np
import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"

class MLService:
    def __init__(self):
        self.clf_pipeline = None
        self.reg_pipeline = None
        self.meta = None
        self._load_models()

    def _load_models(self):
        try:
            self.clf_pipeline = joblib.load(MODEL_DIR / "rf_classifier_v2.joblib")
            self.reg_pipeline = joblib.load(MODEL_DIR / "rf_regressor_v2.joblib")
            with open(MODEL_DIR / "model_meta_v2.json") as f:
                self.meta = json.load(f)
            logger.info("✅ Models and Pipelines V2 loaded successfully")
        except FileNotFoundError:
            logger.error("⚠️ Models not found. Run python ml_pipeline_advanced.py first!")

    def is_loaded(self) -> bool:
        return self.clf_pipeline is not None and self.reg_pipeline is not None

    def predict(self, features: dict):
        if not self.is_loaded():
            raise Exception("Models are not loaded.")
        
        df_input = pd.DataFrame([features])
        water_needed = int(self.clf_pipeline.predict(df_input)[0])
        health_score = float(np.clip(self.reg_pipeline.predict(df_input)[0], 0, 100))
        
        return water_needed, health_score

ml_service = MLService()
