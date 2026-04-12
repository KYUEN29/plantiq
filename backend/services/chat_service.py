import os
import json
import logging
from services.history_service import history_service

logger = logging.getLogger(__name__)

KNOWN_PLANTS = [
    'Money Plant', 'Snake Plant', 'Tulsi', 'Monstera', 'Aloe Vera',
    'Peace Lily', 'Spider Plant', 'Areca Palm', 'Fern', 'Jade Plant'
]

SYSTEM_PROMPT = """You are Plantiq AI — a world-class, friendly plant care expert and data analyst.

Your role:
- Answer ANY question about plant care, health, watering, sunlight, soil, fertilization, pests, and propagation.
- When the user's plant data or assessment history is provided in the context, use it to give specific, personalised advice.
- Be conversational and warm, but stay concise (2–5 sentences max unless asked for more detail).
- Use light emojis (🌿 💧 ☀️ 🪴) to keep answers friendly, but don't overdo it.
- If the user asks about a plant NOT in their history, still answer from general horticultural knowledge.
- Never say you cannot answer a plant-related question.
- Always prioritise data from the user's history if it's available — reference specific trends, health scores, or watering patterns.

Format:
- Short paragraphs, not walls of text.
- Use bullet points only when listing multiple tips.
- If trend data is available, summarise the trend in 1 sentence before advice.
"""


def _build_context_block(context: dict) -> str:
    """Convert frontend context dict into a readable string for the LLM prompt."""
    parts = []

    # Current session results
    session = context.get("current_session")
    if session and isinstance(session, list) and len(session) > 0:
        parts.append("📋 CURRENT SESSION RESULTS:")
        for r in session:
            plant = r.get("plant", "Unknown")
            health = r.get("health", "Unknown")
            confidence = r.get("confidence", "Unknown")
            watering = r.get("watering", "")
            sunlight = r.get("sunlight", "")
            fertilizer = r.get("fertilizer", "")
            parts.append(
                f"  • {plant}: {health} ({confidence} confidence)\n"
                f"    Watering: {watering}\n"
                f"    Sunlight: {sunlight}\n"
                f"    Nutrition: {fertilizer}"
            )

    # Full history (last 10 sessions max to keep prompt size reasonable)
    history = history_service.get_all()
    if history:
        recent = history[-10:]
        parts.append(f"\n📊 ASSESSMENT HISTORY ({len(history)} total sessions, showing last {len(recent)}):")
        for entry in recent:
            ts = entry.get("timestamp", "Unknown time")
            predictions = entry.get("predictions", [])
            for pred in predictions:
                plant = pred.get("plant", "?")
                health = pred.get("health", "?")
                parts.append(f"  • [{ts[:10]}] {plant}: {health}")

    return "\n".join(parts) if parts else "No plant data available yet."


def process_query_with_llm(query: str, context: dict = None) -> str:
    """
    Send the user query + plant context to Google Gemini and return the reply.
    Falls back to keyword responses only if the API key is genuinely missing.
    All real Gemini errors are surfaced as readable messages (not silently swallowed).
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    # Log key status on every call so the server console confirms it's loaded
    if api_key:
        logger.info(f"GEMINI_API_KEY loaded (length={len(api_key)}, prefix={api_key[:8]}...)")
    else:
        logger.warning("GEMINI_API_KEY not set — returning keyword fallback.")
        return _fallback_response(query)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        # Use gemini-pro — stable and available on current v1beta API
        model = genai.GenerativeModel(model_name="gemini-pro")

        # Prepend system prompt directly (compatible with all SDK versions)
        context_block = _build_context_block(context or {})
        full_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"--- USER PLANT DATA ---\n{context_block}\n\n"
            f"User: {query}"
        )

        logger.info(f"Sending prompt to Gemini (length={len(full_prompt)} chars)")
        response = model.generate_content(full_prompt)

        # Safe text extraction — response.text raises if content was blocked
        try:
            reply = response.text.strip()
        except Exception:
            # Try manual extraction from candidates
            try:
                reply = response.candidates[0].content.parts[0].text.strip()
            except Exception:
                reply = ""

        if not reply:
            logger.warning("Gemini returned an empty response (possibly safety-filtered).")
            return "I'm sorry, I wasn't able to generate a response for that question. Please try rephrasing it! 🌿"

        logger.info("Gemini responded successfully.")
        return reply

    except ImportError:
        logger.error("google-generativeai not installed. Run: pip install google-generativeai")
        return _fallback_response(query)
    except Exception as e:
        # Surface the real error so it appears in the chat AND the server log
        error_msg = str(e)
        logger.error(f"Gemini API call failed: {error_msg}", exc_info=True)
        return f"⚠️ Gemini Error: {error_msg}"


def _fallback_response(query: str) -> str:
    """
    Simple keyword fallback used when LLM is unavailable.
    Keeps the app functional without an API key.
    """
    q = query.lower()
    if any(w in q for w in ["water", "dry", "thirsty", "moisture"]):
        return "💧 Most indoor plants prefer to dry out slightly between waterings. Check the top 2 inches of soil — if dry, it's time to water. Yellowing leaves usually mean overwatering."
    if any(w in q for w in ["sun", "light", "shade", "bright"]):
        return "☀️ Most tropical houseplants thrive in bright, indirect light. Direct afternoon sun can scorch leaves. If your plant is leggy and stretching, it needs more light."
    if any(w in q for w in ["fertilizer", "feed", "nutrient", "npk"]):
        return "🌱 Feed with a balanced fertilizer (10-10-10) every 2-4 weeks during spring and summer. Reduce to once a month in autumn and skip entirely in winter."
    if any(w in q for w in ["soil", "repot", "pot", "drainage"]):
        return "🪴 Well-draining potting mix is essential. Add perlite to improve drainage. Repot when roots start circling the bottom or emerging from drainage holes — typically every 1-2 years."
    history = history_service.get_all()
    if any(w in q for w in ["summary", "overview", "how are", "status"]):
        if history:
            total = sum(len(e.get("predictions", [])) for e in history)
            return f"📊 You have {len(history)} assessment session(s) with {total} total plant evaluations on record. Set your GEMINI_API_KEY to unlock AI-powered trend analysis!"
    return "🌿 I'm your Plantiq plant assistant! To unlock AI-powered answers, add your GEMINI_API_KEY to the backend .env file. In the meantime, try asking about watering, sunlight, soil, or fertilizer!"


# Singleton-style module-level function used by the route
class ChatService:
    @staticmethod
    def process_query(query: str, context: dict = None) -> str:
        return process_query_with_llm(query, context)


chat_service = ChatService()
