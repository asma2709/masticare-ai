import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    balanced_accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
)
import joblib
import os
import json

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rf_model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "metrics.json")

def generate_synthetic_training_data(n_samples=6000):
    """
    Generate synthetic bovine health telemetry data reflecting realistic
    dairy physiological parameters and progressive mastitis severity stages.
    
    Classes:
    - 'No Risk': Healthy baseline
    - 'Low Risk': Mild physiological drift / early warning
    - 'Moderate Risk': Subclinical mastitis (elevated EC & pH)
    - 'High Risk': Acute clinical mastitis (fever, high EC, high pH, lethargy)
    """
    np.random.seed(42)

    # Class sample allocation
    n_no = int(n_samples * 0.45)     # 45% healthy
    n_low = int(n_samples * 0.25)    # 25% low risk
    n_mod = int(n_samples * 0.18)    # 18% moderate risk
    n_high = int(n_samples * 0.12)   # 12% high risk

    # 1. Healthy Baseline (No Risk)
    temp_no = np.random.normal(38.5, 0.25, n_no)
    act_no = np.random.normal(82, 8, n_no)
    ph_no = np.random.normal(6.65, 0.08, n_no)
    ec_no = np.random.normal(4.4, 0.25, n_no)
    y_no = ["No Risk"] * n_no

    # 2. Low Risk (Early Drift)
    temp_low = np.random.normal(38.8, 0.30, n_low)
    act_low = np.random.normal(64, 10, n_low)
    ph_low = np.random.normal(6.78, 0.10, n_low)
    ec_low = np.random.normal(5.0, 0.35, n_low)
    y_low = ["Low Risk"] * n_low

    # 3. Moderate Risk (Subclinical Mastitis)
    temp_mod = np.random.normal(39.2, 0.35, n_mod)
    act_mod = np.random.normal(50, 10, n_mod)
    ph_mod = np.random.normal(6.95, 0.12, n_mod)
    ec_mod = np.random.normal(5.7, 0.40, n_mod)
    y_mod = ["Moderate Risk"] * n_mod

    # 4. High Risk (Acute Clinical Mastitis)
    temp_high = np.random.normal(39.9, 0.40, n_high)
    act_high = np.random.normal(32, 9, n_high)
    ph_high = np.random.normal(7.22, 0.15, n_high)
    ec_high = np.random.normal(6.6, 0.50, n_high)
    y_high = ["High Risk"] * n_high

    df = pd.DataFrame({
        "temperature": np.concatenate([temp_no, temp_low, temp_mod, temp_high]),
        "activity": np.concatenate([act_no, act_low, act_mod, act_high]),
        "milk_ph": np.concatenate([ph_no, ph_low, ph_mod, ph_high]),
        "milk_ec": np.concatenate([ec_no, ec_low, ec_mod, ec_high]),
        "risk_category": np.concatenate([y_no, y_low, y_mod, y_high]),
    })

    # Clip values to physically realistic telemetry bounds
    df["temperature"] = df["temperature"].clip(36.5, 42.5)
    df["activity"] = df["activity"].clip(10, 120)
    df["milk_ph"] = df["milk_ph"].clip(6.0, 7.8)
    df["milk_ec"] = df["milk_ec"].clip(3.0, 8.5)

    return df

def train_model():
    print("Generating synthetic bovine telemetry training dataset...")
    df = generate_synthetic_training_data(n_samples=6000)

    feature_cols = ["temperature", "activity", "milk_ph", "milk_ec"]
    X = df[feature_cols]
    y = df["risk_category"]

    # Stratified 80/20 train/test holdout split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training Random Forest Classifier on {len(X_train)} samples...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_model.fit(X_train, y_train)

    # Baseline comparison model (Logistic Regression with max_iter=2000)
    print("Training Baseline Logistic Regression for comparison...")
    lr_model = LogisticRegression(max_iter=2000, random_state=42)
    lr_model.fit(X_train, y_train)

    # Predictions
    y_pred_rf = rf_model.predict(X_test)
    y_pred_lr = lr_model.predict(X_test)

    # Evaluation Metrics
    acc_rf = accuracy_score(y_test, y_pred_rf)
    bal_acc_rf = balanced_accuracy_score(y_test, y_pred_rf)
    prec_rf, rec_rf, f1_rf, _ = precision_recall_fscore_support(y_test, y_pred_rf, average="macro")

    acc_lr = accuracy_score(y_test, y_pred_lr)
    prec_lr, rec_lr, f1_lr, _ = precision_recall_fscore_support(y_test, y_pred_lr, average="macro")

    classes_sorted = sorted(list(set(y_test)))
    cm = confusion_matrix(y_test, y_pred_rf, labels=classes_sorted).tolist()

    # Per-class metrics
    per_class_p, per_class_r, per_class_f, per_class_s = precision_recall_fscore_support(
        y_test, y_pred_rf, labels=classes_sorted
    )
    class_metrics = {}
    for i, c in enumerate(classes_sorted):
        class_metrics[c] = {
            "precision": float(per_class_p[i]),
            "recall": float(per_class_r[i]),
            "f1_score": float(per_class_f[i]),
            "support": int(per_class_s[i]),
        }

    # Feature importance distribution
    feat_importances = {
        col: float(imp) for col, imp in zip(feature_cols, rf_model.feature_importances_)
    }

    metrics_payload = {
        "model": "Random Forest Classifier",
        "model_version": "2.1.0",
        "dataset_type": "Synthetic Multi-Sensor Telemetry Dataset (Software Prototype)",
        "accuracy": float(acc_rf),
        "balanced_accuracy": float(bal_acc_rf),
        "precision": float(prec_rf),
        "recall": float(rec_rf),
        "f1_score": float(f1_rf),
        "baseline_model": "Multinomial Logistic Regression",
        "baseline_accuracy": float(acc_lr),
        "baseline_f1_score": float(f1_lr),
        "classes": classes_sorted,
        "confusion_matrix": cm,
        "class_metrics": class_metrics,
        "feature_importances": feat_importances,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": [
            {"name": "milk_ec", "label": "Milk Electrical Conductivity", "unit": "mS/cm", "importance": feat_importances["milk_ec"]},
            {"name": "activity", "label": "Cow Movement & Rumination Index", "unit": "index", "importance": feat_importances["activity"]},
            {"name": "milk_ph", "label": "Milk pH Acidity", "unit": "pH", "importance": feat_importances["milk_ph"]},
            {"name": "temperature", "label": "Reticulo-Rumen Core Temperature", "unit": "°C", "importance": feat_importances["temperature"]},
        ],
        "protocol_notes": (
            "Model trained and evaluated on 6,000 synthetic bovine telemetry records generated from "
            "established veterinary mastitis thresholds. Evaluated with an 80/20 stratified holdout split. "
            "Demonstrates multi-sensor algorithmic capability for multi-parameter risk classification. "
            "Clinical deployment requires subsequent real-world dairy field validation."
        ),
    }

    print("Writing metrics to metrics.json...")
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"Saving trained model to {MODEL_PATH}...")
    joblib.dump(rf_model, MODEL_PATH)

    print(f"Done. Random Forest Accuracy: {acc_rf:.4f}, Baseline Accuracy: {acc_lr:.4f}")
    return metrics_payload

if __name__ == "__main__":
    train_model()
