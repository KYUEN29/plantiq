import pandas as pd
import numpy as np
import random
import joblib
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, r2_score

# Ensure robust determinism
np.random.seed(42)
random.seed(42)

# --- 1. CONFIG & RANGES ---
PLANTS = ['Money Plant', 'Snake Plant', 'Tulsi', 'Aloe Vera', 'Monstera', 'Peace Lily', 'Spider Plant', 'Areca Palm', 'Fern', 'Jade Plant']
SOILS = ['sandy', 'clay', 'loamy']
POT_SIZES = ['small', 'medium', 'large']
STAGES = ['seedling', 'young', 'mature']

def generate_dataset(num_samples=10000):
    data = []
    print(f"🌿 Generating {num_samples} simulated records...")

    for _ in range(num_samples):
        # Base Selection
        plant = random.choice(PLANTS)
        soil = random.choice(SOILS)
        pot = random.choice(POT_SIZES)
        stage = random.choice(STAGES)
        
        # Temp & Humidity
        temp = round(random.uniform(15, 38), 1)
        humidity = round(random.uniform(25, 95), 1)
        
        # Plant-specific Constraints
        if plant in ['Aloe Vera', 'Jade Plant']:
            base_moisture = random.uniform(5, 35)
            freq = 1
            sunlight = random.uniform(6, 10)
        elif plant in ['Snake Plant', 'Spider Plant']:
            base_moisture = random.uniform(15, 55)
            freq = random.randint(1, 2)
            sunlight = random.uniform(4, 9)
        elif plant in ['Money Plant', 'Tulsi', 'Areca Palm']:
            base_moisture = random.uniform(35, 75)
            freq = random.randint(2, 4)
            sunlight = random.uniform(4, 7)
        else: # Peace Lily, Monstera, Fern
            base_moisture = random.uniform(45, 85)
            freq = random.randint(3, 5)
            humidity = max(humidity, random.uniform(60, 95)) # Enforce high humidity
            sunlight = random.uniform(2, 6)

        # Light Mapping
        if sunlight < 4:
            light = random.uniform(100, 300)
        elif sunlight < 7:
            light = random.uniform(300, 600)
        else:
            light = random.uniform(600, 1200)

        # Time Since Water logic
        time_since = random.uniform(0, 72)
        
        # Soil and Pot effects on Moisture loss
        moisture_drop_rate = 0.5  # base hourly
        if soil == 'sandy': moisture_drop_rate *= 1.5
        elif soil == 'clay': moisture_drop_rate *= 0.6
        if pot == 'small': moisture_drop_rate *= 1.2
        elif pot == 'large': moisture_drop_rate *= 0.8
        
        # Calculate dynamic current moisture
        current_moisture = base_moisture - (moisture_drop_rate * time_since * 0.1)
        current_moisture = max(0.0, min(100.0, current_moisture))

        # Target 1: Water Needed
        # If moisture drops below plant threshold OR Temp is high + moisture moderate
        water_needed = 0
        if plant in ['Aloe Vera', 'Jade Plant'] and current_moisture < 10: water_needed = 1
        elif plant in ['Snake Plant', 'Spider Plant'] and current_moisture < 20: water_needed = 1
        elif plant in ['Money Plant', 'Tulsi', 'Areca Palm'] and current_moisture < 40: water_needed = 1
        elif plant in ['Peace Lily', 'Monstera', 'Fern'] and current_moisture < 55: water_needed = 1
        # Environmental trigger
        if current_moisture < 45 and temp > 33: water_needed = 1
        # Overwater protection
        if humidity > 80 and current_moisture > 75: water_needed = 0

        # Target 2: Health Score (start 100, deduct points for out of bounds)
        health = 100.0
        if water_needed == 1 and time_since > 48: health -= 15
        if temp < 18 or temp > 35: health -= 10
        if plant in ['Fern', 'Monstera'] and humidity < 50: health -= 20
        if plant in ['Aloe Vera', 'Jade Plant'] and humidity > 70: health -= 15
        if stage == 'seedling' and abs(temp - 24) > 5: health -= 10 # sensitive
        
        health += random.uniform(-5, 5) # Noise
        health = max(0.0, min(100.0, round(health, 1)))

        data.append({
            'plant_type': plant, 'soil_type': soil, 'pot_size': pot, 'growth_stage': stage,
            'moisture': round(current_moisture, 1), 'temperature': temp, 'humidity': humidity,
            'light': round(light, 1), 'sunlight_hours': round(sunlight, 1),
            'time_since_last_water': round(time_since, 1), 'watering_frequency': freq,
            'water_needed': water_needed, 'health_score': health
        })

    df = pd.DataFrame(data)
    return df

# --- 2. TRAIN PIPELINE ---
def train_and_save():
    df = generate_dataset(10000)
    
    BASE_DIR = Path(__file__).resolve().parent
    df.to_csv(BASE_DIR / 'advanced_plant_data.csv', index=False)
    print("✅ Saved advanced_plant_data.csv")

    X = df.drop(columns=['water_needed', 'health_score'])
    y_class = df['water_needed']
    y_reg = df['health_score']

    # Preprocessor
    categorical_features = ['plant_type', 'soil_type', 'pot_size', 'growth_stage']
    numeric_features = ['moisture', 'temperature', 'humidity', 'light', 'sunlight_hours', 'time_since_last_water', 'watering_frequency']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(drop='first', sparse_output=False), categorical_features)
        ])

    X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42
    )

    # Classifier (Water needed)
    print("🧠 Training Classifier...")
    clf_pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))])
    clf_pipeline.fit(X_train, yc_train)
    yc_pred = clf_pipeline.predict(X_test)
    print(f"Classifier Accuracy: {accuracy_score(yc_test, yc_pred):.4f}")

    # Regressor (Health Score)
    print("🧠 Training Regressor...")
    reg_pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))])
    reg_pipeline.fit(X_train, yr_train)
    yr_pred = reg_pipeline.predict(X_test)
    print(f"Regressor R2 Score: {r2_score(yr_test, yr_pred):.4f}")
    print(f"Regressor RMSE: {np.sqrt(mean_squared_error(yr_test, yr_pred)):.4f}")

    # Create model dir
    model_dir = BASE_DIR / "model"
    model_dir.mkdir(exist_ok=True)

    # Save logic
    joblib.dump(clf_pipeline, model_dir / 'rf_classifier_v2.joblib')
    joblib.dump(reg_pipeline, model_dir / 'rf_regressor_v2.joblib')

    # Save meta
    meta = {
        "features": numeric_features + categorical_features,
        "metrics": {
            "clf_accuracy": accuracy_score(yc_test, yc_pred),
            "reg_r2": r2_score(yr_test, yr_pred)
        }
    }
    with open(model_dir / "model_meta_v2.json", "w") as f:
        json.dump(meta, f)
    
    print(f"✅ Models saved successfully in {model_dir}")

if __name__ == "__main__":
    train_and_save()
