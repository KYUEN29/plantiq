import re
import logging
from services.history_service import history_service

logger = logging.getLogger(__name__)

KNOWN_PLANTS = ['Money Plant', 'Snake Plant', 'Tulsi', 'Monstera', 'Aloe Vera', 
                'Peace Lily', 'Spider Plant', 'Areca Palm', 'Fern', 'Jade Plant']

class ChatService:
    @staticmethod
    def _find_plant_in_query(query_lower):
        """Extract a known plant name from the user's query."""
        for kp in KNOWN_PLANTS:
            if kp.lower() in query_lower:
                return kp
        return None
    
    @staticmethod
    def _get_plant_history(history, plant_name):
        """Collect all prediction entries for a specific plant across history."""
        entries = []
        for record in history:
            timestamp = record.get("timestamp", "")
            for i, pred in enumerate(record.get("predictions", [])):
                if pred.get("plant") == plant_name:
                    plant_input = None
                    plants_list = record.get("plants", [])
                    if i < len(plants_list):
                        plant_input = plants_list[i]
                    entries.append({
                        "timestamp": timestamp,
                        "prediction": pred,
                        "input": plant_input
                    })
        return entries

    @staticmethod
    def _analyze_trend(entries):
        """Determine if health is improving, declining, or stable across entries."""
        if len(entries) < 2:
            return None
        
        scores = []
        for e in entries:
            h = e["prediction"].get("health", "")
            if "Healthy" in h:
                scores.append(100)
            elif "attention" in h:
                scores.append(60)
            else:
                scores.append(30)
        
        # Compare last vs first
        recent_avg = sum(scores[-2:]) / 2
        early_avg = sum(scores[:2]) / 2
        
        if recent_avg > early_avg + 10:
            return "improving"
        elif recent_avg < early_avg - 10:
            return "declining"
        return "stable"

    @staticmethod
    def process_query(query: str, context: dict = None) -> str:
        """
        Rules-based NLP engine with trend analysis, session awareness,
        and history-powered responses.
        """
        query_lower = query.lower().strip()
        history = history_service.get_all()
        
        # ── Greetings ───────────────────────────────────────────────────
        if any(w in query_lower for w in ["hello", "hi", "hey", "greetings"]):
            if history:
                total = sum(len(e.get("predictions", [])) for e in history)
                return f"Hello! I'm Plantiq AI, your plant-care assistant. I have {total} plant assessments on record. Ask me about a specific plant or say 'summary' for an overview!"
            return "Hello! I'm Plantiq AI. You haven't run any assessments yet — start one through the Wizard and then ask me anything!"
        
        # ── Summary / overview intent ───────────────────────────────────
        if any(w in query_lower for w in ["summary", "overview", "stats", "report"]):
            if not history:
                return "No assessment history found yet. Run your first analysis through the Wizard!"
            
            total_assessments = len(history)
            total_plants = sum(len(e.get("predictions", [])) for e in history)
            
            # Find most-evaluated plant
            plant_counts = {}
            for entry in history:
                for pred in entry.get("predictions", []):
                    name = pred.get("plant", "Unknown")
                    plant_counts[name] = plant_counts.get(name, 0) + 1
            
            most_common = max(plant_counts, key=plant_counts.get) if plant_counts else "N/A"
            
            return (
                f"📊 Assessment Summary:\n"
                f"• Total sessions: {total_assessments}\n"
                f"• Total plant evaluations: {total_plants}\n"
                f"• Most frequently assessed: {most_common} ({plant_counts.get(most_common, 0)} times)\n\n"
                f"Ask about any specific plant for detailed trend analysis!"
            )
        
        # ── Current session awareness ───────────────────────────────────
        if context and "current_session" in context:
            session_results = context["current_session"]
            # If user asking about "current" or "latest" or "my results"
            if any(w in query_lower for w in ["current", "latest", "my results", "just ran", "this session"]):
                if isinstance(session_results, list) and len(session_results) > 0:
                    summaries = []
                    for r in session_results:
                        summaries.append(f"• {r.get('plant', '?')}: {r.get('health', '?')} ({r.get('confidence', '?')} confidence)")
                    return "Here's what your latest assessment found:\n" + "\n".join(summaries)
        
        # ── Specific plant inquiry with trend analysis ──────────────────
        if any(w in query_lower for w in ["how is", "status of", "doing lately", "health of", "check on", "tell me about"]):
            target_plant = ChatService._find_plant_in_query(query_lower)
            
            if not history:
                return "I don't have any historical assessments yet. Try running your first plant analysis through the Wizard!"
            
            if target_plant:
                entries = ChatService._get_plant_history(history, target_plant)
                
                if not entries:
                    return f"I haven't evaluated a {target_plant} in your history yet. Add it to your next Wizard session!"
                
                latest = entries[-1]["prediction"]
                health = latest.get("health", "Unknown")
                confidence = latest.get("confidence", "Moderate")
                watering = latest.get("watering", "N/A")
                
                response = f"Your {target_plant} is currently marked as '{health}' ({confidence} confidence).\n💧 Watering: {watering}"
                
                # Trend analysis across multiple entries
                if len(entries) >= 2:
                    trend = ChatService._analyze_trend(entries)
                    if trend == "improving":
                        response += f"\n\n📈 Trend: Health has been IMPROVING over your last {len(entries)} assessments. Keep up the good care!"
                    elif trend == "declining":
                        response += f"\n\n📉 Trend: Health appears to be DECLINING. Consider adjusting your watering or sunlight conditions."
                    else:
                        response += f"\n\n➡️ Trend: Health has been STABLE across {len(entries)} assessments."
                    
                    # Check for chronic dryness
                    dry_count = sum(1 for e in entries if e.get("input", {}) and e["input"].get("water") in ["Completely dry", "Slightly dry"])
                    if dry_count >= 2:
                        response += f"\n⚠️ Warning: This plant has been reported as dry {dry_count} times. Chronic dehydration is a risk."
                
                return response
            
            return "Please specify which plant you're curious about! I track: " + ", ".join(KNOWN_PLANTS[:5]) + ", and more."
            
        # ── General care topics ─────────────────────────────────────────
        if any(w in query_lower for w in ["water", "watering", "dry", "thirsty", "moisture"]):
            return "💧 Watering Tip: Most indoor plants prefer their soil to dry out between waterings. Always check the top 2 inches of soil. Yellowing leaves often signal overwatering, while crispy brown edges suggest underwatering."
            
        if any(w in query_lower for w in ["sun", "light", "shade", "bright", "dark"]):
            return "☀️ Light Guide: Low-light plants (snake plant, fern) burn in direct sun. Most tropical plants thrive in bright, indirect light. If leaves stretch or get leggy, that's a sign they need more light."
            
        if any(w in query_lower for w in ["fertilizer", "nutrient", "feed", "food", "npk"]):
            return "🌱 Nutrition: Most houseplants benefit from balanced fertilizer (10-10-10) during the growing season (spring/summer). Reduce feeding in winter. Over-fertilizing causes salt buildup and leaf burn."
            
        if any(w in query_lower for w in ["soil", "repot", "pot", "drainage"]):
            return "🪴 Soil & Potting: Use well-draining potting mix for most plants. Ensure pots have drainage holes. Repot when roots circle the bottom or emerge from drainage holes — typically every 1-2 years."
        
        # ── Fallback ────────────────────────────────────────────────────
        return "I can help with plant care advice and your assessment history! Try asking:\n• 'How is my Snake Plant doing?'\n• 'Give me a summary'\n• 'Watering tips'\n• 'Tell me about my current results'"

chat_service = ChatService()

