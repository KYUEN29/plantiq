def preprocess_input(data: dict) -> dict:
    known_plants = ['Money Plant', 'Snake Plant', 'Tulsi', 'Aloe Vera', 'Monstera', 'Peace Lily', 'Spider Plant', 'Areca Palm', 'Fern', 'Jade Plant']
    plant_type = data['name'] if data['name'] in known_plants else 'Fern'

    if data['water'] == "Overwatered":
        wf = 7.0
        time_since = 1.0
    elif data['water'] == "Properly watered":
        wf = 3.0
        time_since = 24.0
    elif data['water'] == "Slightly dry":
        wf = 1.5
        time_since = 72.0
    else: # Completely dry
        wf = 0.5
        time_since = 120.0

    if data['sunlight'] == "Full direct sun":
        sh, light = 10.0, 1000.0
    elif data['sunlight'] == "Partial shade":
        sh, light = 5.0, 500.0
    elif data['sunlight'] == "Low indirect light":
        sh, light = 2.0, 200.0
    else: # No light
        sh, light = 0.0, 50.0

    if data['soil'] == "Soggy":
        moisture = 95.0
    elif data['soil'] == "Moist":
        moisture = 70.0
    elif data['soil'] == "Dry topsoil":
        moisture = 35.0
    else: # Bone dry
        moisture = 10.0

    temp = 24.0
    humidity = 50.0

    return {
        "plant_type": plant_type,
        "soil_type": "loamy",
        "pot_size": "medium",
        "growth_stage": "mature",
        "moisture": moisture,
        "temperature": temp,
        "humidity": humidity,
        "light": light,
        "sunlight_hours": sh,
        "time_since_last_water": time_since,
        "watering_frequency": wf
    }

def map_recommendations(water_needed: int, health_score: float, features: dict, color: str, name: str) -> dict:
    if water_needed == 1 or features["moisture"] < 30:
        watering = "Water immediately. Increase watering frequency."
    elif features["moisture"] > 80:
        watering = "Stop watering. Let soil dry out for a week to prevent rot."
    else:
        watering = "Maintain current watering schedule."

    if features["sunlight_hours"] < 4:
        sunlight = "Needs more light. Move to a brighter spot."
    elif features["sunlight_hours"] > 7 and features["temperature"] > 30:
        sunlight = "Move to partial shade to avoid sunburn."
    else:
        sunlight = "Current sunlight exposure is optimal."

    if color == "Healthy green" and health_score > 70:
        fertilizer = "Use standard liquid fertilizer once a month."
        health_status = "Healthy"
    elif color == "Yellowing edges":
        fertilizer = "Use nitrogen-rich fertilizer weekly to restore color."
        health_status = "Needs attention"
    elif color == "Brown/crispy" or health_score < 50:
        fertilizer = "Avoid fertilizer until plant recovers. Focus on hydration."
        health_status = "Critical"
    elif color == "Drooping":
        fertilizer = "Do not fertilize currently. Adjust water."
        health_status = "Needs attention"
    else:
        if health_score < 70:
            health_status = "Needs attention"
            fertilizer = "Use a balanced fertilizer bi-weekly."
        else:
            health_status = "Healthy"
            fertilizer = "Standard organic compost monthly."

    if features["moisture"] > 90 and color != "Healthy green":
         health_status = "Critical"

    return {
        "plant": name,
        "watering": watering,
        "sunlight": sunlight,
        "fertilizer": fertilizer,
        "health": health_status
    }
