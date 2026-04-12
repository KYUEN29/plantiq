import json
import datetime
from pathlib import Path

# Ensure /data exists
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"

class HistoryService:
    @staticmethod
    def save_batch(batch_data_dict, results_dict):
        # Format the entry per the user's explicit schema requirements
        history_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "plants": batch_data_dict["plants"],
            "predictions": results_dict["results"]
        }
        
        current_history = []
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, "r") as f:
                    current_history = json.load(f)
            except Exception:
                pass
        
        current_history.append(history_entry)
        
        with open(HISTORY_FILE, "w") as f:
            json.dump(current_history, f, indent=2)

    @staticmethod
    def contextualize_prediction(plant_name, current_water_state, recs):
        """
        Adaptive Learning Logic:
        If the same plant appears in history repeating 'Completely dry' or 'Slightly dry',
        we synthetically boost the watering recommendation to simulate system trend awareness.
        """
        if not HISTORY_FILE.exists():
            return recs
            
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except Exception:
            return recs

        # Count previous occurrences of dryness for this specific plant
        dry_count = 0
        for entry in history:
            for plant_input in entry.get("plants", []):
                if plant_input.get("name") == plant_name:
                    if plant_input.get("water") in ["Completely dry", "Slightly dry"]:
                        dry_count += 1

        # If it's a chronic issue (>= 2 previous occurrences) and it's dry again, escalate
        if dry_count >= 2 and current_water_state in ["Completely dry", "Slightly dry"]:
            recs["watering"] = "Chronic dehydration detected: Substantially increase watering frequency immediately."
            
        return recs

    @staticmethod
    def get_all():
        if not HISTORY_FILE.exists():
            return []
            
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []

history_service = HistoryService()
