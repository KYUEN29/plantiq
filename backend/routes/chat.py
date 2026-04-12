from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Any
from services.chat_service import chat_service
from services.history_service import history_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    context: Optional[Any] = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse, tags=["AI Chatbot"])
def chat(payload: ChatRequest):
    """
    Exposes a dynamic Chat assistant that answers queries by internally 
    parsing the history dataset.
    """
    try:
        # Auto-populate context from history if frontend didn't supply any
        context = payload.context
        if not context:
            context = {"history": history_service.get_all()}

        reply_string = chat_service.process_query(payload.query, context)
        return ChatResponse(reply=reply_string)
    except Exception as e:
        logger.exception("Failed to process chat query.")
        return ChatResponse(reply="I am currently experiencing technical difficulties. Please try again later!")
