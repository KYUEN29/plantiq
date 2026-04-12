from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from routes.predict import router as predict_router
from services.ml_service import ml_service

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="🌿 Smart Plant Monitoring API V2 (Multi-Plant)",
    description="AI-powered plant health prediction using Random Forest pipelines",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "🌿 Smart Plant Monitoring API V2 (Multi-Plant) running!",
        "model_loaded": ml_service.is_loaded()
    }

@app.get("/health", tags=["Health"])
def health_check():
    if not ml_service.is_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded")
    return {"status": "ok"}
