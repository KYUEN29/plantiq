import os
import logging
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

from routes.predict import router as predict_router
from routes.chat import ChatRequest  # Import the existing model
from routes.history import router as history_router
from services.ml_service import ml_service

# Client creation for the new google-genai SDK
client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

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
# chat_router inclusion removed to use the direct route below
app.include_router(history_router)

@app.post('/chat')
def chat(request: ChatRequest):
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction="You are Plantiq, an expert AI assistant for home plant care. Only answer questions about plants, gardening, watering, sunlight, and soil. Keep answers concise and friendly."
            )
        )
        return {'reply': response.text}
    except Exception as e:
        return {'reply': f'Sorry, I could not process your request right now. (Error: {str(e)})'}

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

# updated: gemini-sdk-fix — forces Render to reinstall with google-generativeai>=0.8.0
