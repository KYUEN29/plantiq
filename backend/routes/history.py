from fastapi import APIRouter, HTTPException
import json
import logging
from pathlib import Path
from services.history_service import history_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/history", tags=["History"])
def get_history():
    """
    Returns the complete list of history entries from data/history.json.
    Exposed natively for frontend Recharts data visualizations.
    """
    try:
        return history_service.get_all()
    except Exception as e:
        logger.exception("Failed to read history mapping dataset.")
        raise HTTPException(status_code=500, detail="Cannot read history file.")
