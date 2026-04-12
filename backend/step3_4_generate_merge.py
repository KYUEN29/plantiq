"""
STEP 3 + 4: Generate Synthetic Data & Merge
============================================
Expands cleaned dataset from 50 → 950 rows.
Logical rules per plant type are strictly enforced.
"""

import pandas as pd
import numpy as np

np.random.seed(42)

# ── Load cleaned base dataset ─────────────────────────────────────────────────
base = pd.read_csv("data/cleaned_plant_data.csv")
print(f"Base dataset loaded: {len(base)} rows")

# ── Plant type profiles (realistic sensor ranges per species) ─────────────────
PROFILES = {
    "Rose": {
        "encoded": 0,
        "moisture_healthy": (55, 85),   # needs moist soil
        "moisture_dry":     (15, 45),
        "temp":             (18, 30),
        "humidity":         (50, 80),
        "light":            (300, 700),
        "health_healthy":   (75, 95),
        "health_dry":       (35, 65),
    },
    "Cactus": {
        "encoded": 1,
        "moisture_healthy": (10, 40),   # thrives dry
        "moisture_dry":     (5,  15),
        "temp":             (28, 42),
        "humidity":         (20, 45),
        "light":            (600, 980),
        "health_healthy":   (70, 95),
        "health_dry":       (30, 60),
    },
    "Fern": {
        "encoded": 2,
        "moisture_healthy": (65, 92),   # loves moisture
        "moisture_dry":     (20, 50),
        "temp":             (18, 28),
        "humidity":         (60, 90),
        "light":            (150, 450),
        "health_healthy":   (78, 96),
        "health_dry":       (30, 62),
    },
}

def generate_plant_rows(plant_type, n_healthy, n_dry):
    """Generate n_healthy + n_dry rows for a given plant type."""
    p = PROFILES[plant_type]
    rows = []

    # Healthy / well-watered rows (water_needed = 0)
    for _ in range(n_healthy):
        moisture     = np.random.uniform(*p["moisture_healthy"])
        temp         = np.random.uniform(*p["temp"])
        humidity     = np.random.uniform(*p["humidity"])
        light        = np.random.uniform(*p["light"])
        health_score = np.random.uniform(*p["health_healthy"])
        # Add small correlated noise: higher moisture → slightly higher health
        health_score = np.clip(health_score + (moisture - 60) * 0.1, 0, 100)
        rows.append({
            "moisture":          round(moisture, 2),
            "temp":              round(temp, 2),
            "humidity":          round(humidity, 2),
            "light":             round(light, 2),
            "plant_type":        plant_type,
            "plant_type_encoded": p["encoded"],
            "water_needed":      0,
            "health_score":      round(health_score, 2),
        })

    # Dry / needs-water rows (water_needed = 1)
    for _ in range(n_dry):
        moisture     = np.random.uniform(*p["moisture_dry"])
        temp         = np.random.uniform(*p["temp"])
        humidity     = np.random.uniform(*p["humidity"])
        light        = np.random.uniform(*p["light"])
        health_score = np.random.uniform(*p["health_dry"])
        # Low moisture → lower health
        health_score = np.clip(health_score - (50 - moisture) * 0.15, 0, 100)
        rows.append({
            "moisture":          round(moisture, 2),
            "temp":              round(temp, 2),
            "humidity":          round(humidity, 2),
            "light":             round(light, 2),
            "plant_type":        plant_type,
            "plant_type_encoded": p["encoded"],
            "water_needed":      1,
            "health_score":      round(health_score, 2),
        })

    return rows

# ── Generate ~900 synthetic rows (balanced per plant, 50/50 label split) ──────
all_rows = []
for plant in ["Rose", "Cactus", "Fern"]:
    all_rows += generate_plant_rows(plant, n_healthy=150, n_dry=150)

synthetic_df = pd.DataFrame(all_rows)
synthetic_df = synthetic_df.sample(frac=1, random_state=42).reset_index(drop=True)
print(f"Synthetic rows generated: {len(synthetic_df)}")

# ── Merge real + synthetic ────────────────────────────────────────────────────
# Align base columns to match synthetic
base_aligned = base[["moisture","temp","humidity","light",
                       "plant_type","plant_type_encoded",
                       "water_needed","health_score"]].copy()

merged = pd.concat([base_aligned, synthetic_df], ignore_index=True)
merged = merged.sample(frac=1, random_state=99).reset_index(drop=True)

# Final type enforcement
merged["water_needed"]       = merged["water_needed"].astype(int)
merged["plant_type_encoded"] = merged["plant_type_encoded"].astype(int)

print(f"Merged dataset total rows : {len(merged)}")
print(f"water_needed distribution :\n{merged['water_needed'].value_counts().to_dict()}")
print(f"Plant type distribution   :\n{merged['plant_type'].value_counts().to_dict()}")
print(f"Health score range        : {merged['health_score'].min():.1f} – {merged['health_score'].max():.1f}")

# ── Save ──────────────────────────────────────────────────────────────────────
merged.to_csv("data/final_plant_data.csv", index=False)
print(f"\n✅ Final dataset saved → data/final_plant_data.csv ({len(merged)} rows)")
