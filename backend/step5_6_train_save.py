"""
STEP 5 + 6: Train AI Model & Save
===================================
Trains two Random Forest models:
  1. Classifier → water_needed (0 or 1)
  2. Regressor  → health_score (0–100)
Saves both models + scaler via joblib.
"""

import pandas as pd
import numpy as np
import joblib
import json
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, classification_report,
                             mean_absolute_error, r2_score)

print("=" * 60)
print("  STEP 5+6: TRAIN & SAVE AI MODELS")
print("=" * 60)

# ── Load merged dataset ───────────────────────────────────────────────────────
df = pd.read_csv("data/final_plant_data.csv")
print(f"\n📂 Dataset loaded: {df.shape[0]} rows")

# ── Features & targets ────────────────────────────────────────────────────────
FEATURES = ["moisture", "temp", "humidity", "light"]

X = df[FEATURES].values
y_class = df["water_needed"].values          # classification target
y_reg   = df["health_score"].values          # regression target

# ── Scale features ────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
print(f"✅ Features scaled with StandardScaler")

# ── Train / test split ────────────────────────────────────────────────────────
X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
    X_scaled, y_class, y_reg,
    test_size=0.2, random_state=42, stratify=y_class
)
print(f"   Train size : {len(X_train)} | Test size : {len(X_test)}")

# ── Model 1: Random Forest Classifier (water_needed) ─────────────────────────
print("\n🌲 Training RandomForestClassifier (water_needed)...")
clf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
clf.fit(X_train, yc_train)

yc_pred = clf.predict(X_test)
clf_acc  = accuracy_score(yc_test, yc_pred)
cv_scores = cross_val_score(clf, X_scaled, y_class, cv=5, scoring="accuracy")

print(f"   Test Accuracy     : {clf_acc*100:.2f}%")
print(f"   Cross-val (5-fold): {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
print(f"\n   Classification Report:")
print(classification_report(yc_test, yc_pred, target_names=["No Water","Needs Water"]))

# ── Model 2: Random Forest Regressor (health_score) ──────────────────────────
print("🌲 Training RandomForestRegressor (health_score)...")
reg = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
reg.fit(X_train, yr_train)

yr_pred = reg.predict(X_test)
mae = mean_absolute_error(yr_test, yr_pred)
r2  = r2_score(yr_test, yr_pred)

print(f"   Mean Absolute Error : {mae:.2f} points")
print(f"   R² Score            : {r2:.4f}")

# ── Feature importance ────────────────────────────────────────────────────────
print("\n📊 Feature Importances (Classifier):")
for feat, imp in sorted(zip(FEATURES, clf.feature_importances_),
                         key=lambda x: -x[1]):
    bar = "█" * int(imp * 40)
    print(f"   {feat:10s}: {imp:.4f}  {bar}")

# ── Save models & scaler ──────────────────────────────────────────────────────
joblib.dump(clf,    "model/rf_classifier.joblib")
joblib.dump(reg,    "model/rf_regressor.joblib")
joblib.dump(scaler, "model/scaler.joblib")

# Save metadata for the API to load
meta = {
    "features":       FEATURES,
    "classifier_acc": round(clf_acc, 4),
    "regressor_mae":  round(mae, 4),
    "regressor_r2":   round(r2, 4),
    "plant_type_map": {"Rose": 0, "Cactus": 1, "Fern": 2},
    "cv_mean_acc":    round(cv_scores.mean(), 4),
}
with open("model/model_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print(f"\n💾 Saved:")
print(f"   model/rf_classifier.joblib")
print(f"   model/rf_regressor.joblib")
print(f"   model/scaler.joblib")
print(f"   model/model_meta.json")
print(f"\n✅ STEP 5+6 COMPLETE — Models trained and saved successfully!")
