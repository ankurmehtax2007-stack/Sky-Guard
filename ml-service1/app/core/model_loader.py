import json
import os
import joblib
import numpy as np
from functools import lru_cache
from .config import MODEL_DIR, METADATA_PATH

DEFAULT_METADATA = {
    "architecture_version": "SkyGuard 2.0 Multi-Tier Complete",
    "feature_cols": [
        "latitude", "longitude", "temperature_c", "humidity_pct", "pressure_hpa",
        "day", "dayofweek", "hour_sin", "hour_cos", "month_sin", "month_cos",
        "cluster_temp_mean", "cluster_temp_std", "cluster_press_mean", "cluster_press_std",
        "cluster_hum_mean", "cluster_hum_std", "spatial_temp_diff", "spatial_temp_zscore",
        "spatial_press_diff", "spatial_press_zscore", "spatial_hum_diff", "spatial_hum_zscore",
        "neighbor_dev_score", "station_neighbor_consistency", "cluster_anomaly_pct",
        "temp_press_ratio", "temp_hum_ratio", "hum_press_ratio", "dewpoint_c",
        "dewpoint_depression_c", "vapor_pressure_ratio",
        "temperature_c_lag1", "temperature_c_lag24", "temperature_c_diff_lag1",
        "temperature_c_diff_lag24", "temperature_c_rate_1h", "temperature_c_roll6_med",
        "temperature_c_roll6_mean", "temperature_c_roll6_var", "temperature_c_frozen_count",
        "temperature_c_roll24_mean", "temperature_c_roll24_std", "temperature_c_roll24_diff",
        "temperature_c_roll24_zscore", "humidity_pct_lag1", "humidity_pct_lag24",
        "humidity_pct_diff_lag1", "humidity_pct_diff_lag24", "humidity_pct_rate_1h",
        "humidity_pct_roll6_med", "humidity_pct_roll6_mean", "humidity_pct_roll6_var",
        "humidity_pct_frozen_count", "humidity_pct_roll24_mean", "humidity_pct_roll24_std",
        "humidity_pct_roll24_diff", "humidity_pct_roll24_zscore", "pressure_hpa_lag1",
        "pressure_hpa_lag24", "pressure_hpa_diff_lag1", "pressure_hpa_diff_lag24",
        "pressure_hpa_rate_1h", "pressure_hpa_roll6_med", "pressure_hpa_roll6_mean",
        "pressure_hpa_roll6_var", "pressure_hpa_frozen_count", "pressure_hpa_roll24_mean",
        "pressure_hpa_roll24_std", "pressure_hpa_roll24_diff", "pressure_hpa_roll24_zscore",
        "cluster_Konkan_Deccan", "cluster_NCR",
        "cluster_Tamil_Nadu_Coast", "cluster_West_Bengal"
    ],
    "num_classes": 10,
    "classes": [
        "normal", "temperature_spike", "humidity_spike", "pressure_jump",
        "freeze", "drift", "offset", "missing_data",
        "multivariate_inconsistency", "spatial_inconsistency"
    ],
    "fusion_config": {
        "w_xgboost": 0.45, "w_physics": 0.25, "w_iforest": 0.15, "w_temporal": 0.075, "w_spatial": 0.075
    },
    "decision_config": {
        "anomaly_threshold": 0.40, "known_class_threshold": 0.40, "novelty_threshold": 0.65
    },
    "physics_config": {
        "temp_min_c": -15.0, "temp_max_c": 48.0, "humidity_min_pct": 5.0, "humidity_max_pct": 98.0,
        "pressure_min_hpa": 940.0, "pressure_max_hpa": 1045.0, "temp_max_rate_c_per_hr": 8.0,
        "humidity_max_rate_pct_per_hr": 25.0, "pressure_max_rate_hpa_per_hr": 4.0,
        "max_dewpoint_depression_c": 35.0, "min_dewpoint_depression_c": -0.5,
        "weight_range": 0.35, "weight_rate": 0.25, "weight_dewpoint": 0.20, "weight_cross_sensor": 0.20
    },
    "severity_config": {
        "weight_anomaly_strength": 0.40, "weight_persistence": 0.20,
        "weight_confidence": 0.20, "weight_multi_sensor": 0.20,
        "thresholds": { "LOW": 0.0, "MEDIUM": 0.35, "HIGH": 0.60, "CRITICAL": 0.80 }
    },
    "health_config": {
        "base_score": 100.0, "max_anomaly_deduction": 45.0,
        "max_drift_deduction": 25.0, "max_missing_deduction": 20.0,
        "max_physics_deduction": 25.0
    }
}

def heuristic_iso_predict(X):
    arr = np.asarray(X, dtype=float)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    t = arr[:, 2] if arr.shape[1] > 2 else 25.0
    rh = arr[:, 3] if arr.shape[1] > 3 else 50.0
    p = arr[:, 4] if arr.shape[1] > 4 else 1013.25
    dev_t = np.maximum(0.0, np.abs(t - 28.5) - 13.0) / 10.0
    dev_rh = np.maximum(0.0, np.abs(rh - 55.0) - 35.0) / 15.0
    dev_p = np.maximum(0.0, np.abs(p - 1008.0) - 25.0) / 15.0
    total_dev = dev_t + dev_rh + dev_p
    return np.where(total_dev > 0.05, -0.10 - total_dev * 0.45, 0.22 - total_dev * 0.2)

def heuristic_xgb_predict(X, num_classes=10):
    arr = np.asarray(X, dtype=float)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    n = len(arr)
    probs = np.zeros((n, num_classes), dtype=float)
    for i in range(n):
        t = arr[i, 2] if arr.shape[1] > 2 else 25.0
        rh = arr[i, 3] if arr.shape[1] > 3 else 50.0
        p = arr[i, 4] if arr.shape[1] > 4 else 1013.25
        t_z = arr[i, 18] if arr.shape[1] > 18 else (t - 28.5) / 5.5
        frozen_count = arr[i, 40] if arr.shape[1] > 40 else 1.0

        if t >= 48.0 or t <= -12.0:
            conf = min(0.96, 0.75 + min(0.20, (max(t - 48.0, -12.0 - t) / 10.0) * 0.15))
            probs[i, 1] = conf
            probs[i, 0] = 1.0 - conf
        elif rh >= 98.0 or rh <= 5.0:
            probs[i, 2] = 0.92
            probs[i, 0] = 0.08
        elif p <= 930.0 or p >= 1060.0:
            probs[i, 3] = 0.92
            probs[i, 0] = 0.08
        elif frozen_count >= 5.0:
            probs[i, 4] = 0.90
            probs[i, 0] = 0.10
        elif t >= 42.0 and rh >= 88.0:
            probs[i, 8] = 0.88
            probs[i, 0] = 0.12
        elif abs(t_z) >= 3.5:
            probs[i, 9] = 0.85
            probs[i, 0] = 0.15
        else:
            probs[i, 0] = 0.95
            probs[i, 1:] = 0.05 / (num_classes - 1)
    return probs

def _build_fresh_models(feature_cols, num_classes=10):
    n = len(feature_cols)
    rng = np.random.default_rng(42)
    n_samples = 1500
    X = rng.normal(0, 1, (n_samples, n))
    y = np.zeros(n_samples, dtype=int)

    # Class 0: Normal
    X[:700, 2] = rng.normal(28.5, 5.0, 700)
    X[:700, 3] = rng.uniform(35.0, 75.0, 700)
    X[:700, 4] = rng.normal(1008.0, 5.0, 700)
    y[:700] = 0

    # Class 1: Temperature Spike
    X[700:800, 2] = rng.uniform(49.0, 62.0, 100)
    X[700:800, 3] = rng.uniform(15.0, 40.0, 100)
    X[700:800, 4] = rng.normal(1005.0, 5.0, 100)
    y[700:800] = 1

    # Class 2: Humidity Spike
    X[800:900, 2] = rng.normal(28.0, 4.0, 100)
    X[800:900, 3] = rng.uniform(98.0, 100.0, 100)
    X[800:900, 4] = rng.normal(1008.0, 5.0, 100)
    y[800:900] = 2

    # Class 3: Pressure Jump
    X[900:1000, 2] = rng.normal(28.0, 4.0, 100)
    X[900:1000, 3] = rng.uniform(40.0, 70.0, 100)
    X[900:1000, 4] = rng.uniform(880.0, 930.0, 100)
    y[900:1000] = 3

    for c_idx in range(4, num_classes):
        start = 1000 + (c_idx - 4) * 80
        end = start + 80
        X[start:end, 2] = rng.normal(28.5 + (c_idx * 2), 4.0, 80)
        X[start:end, 3] = rng.uniform(30.0, 80.0, 80)
        X[start:end, 4] = rng.normal(1008.0, 6.0, 80)
        y[start:end] = c_idx

    iso = None
    try:
        from sklearn.ensemble import IsolationForest
        iso = IsolationForest(n_estimators=100, max_samples=256, contamination=0.01, random_state=42, n_jobs=1).fit(X[y == 0])
    except Exception:
        iso = heuristic_iso_predict

    xgb = None
    try:
        from xgboost import XGBClassifier
        xgb = XGBClassifier(
            n_estimators=45, max_depth=5, learning_rate=0.10,
            subsample=0.9, colsample_bytree=0.8,
            objective='multi:softprob', num_class=num_classes,
            eval_metric='mlogloss', random_state=42, n_jobs=1
        )
        xgb.fit(X, y)
    except Exception:
        xgb = heuristic_xgb_predict

    try:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if hasattr(iso, 'estimators_'):
            joblib.dump(iso, MODEL_DIR / 'isolation_forest_model.joblib')
        if hasattr(xgb, 'get_booster'):
            joblib.dump(xgb, MODEL_DIR / 'xgboost_classifier.joblib')
    except Exception:
        pass

    return iso, xgb

@lru_cache(maxsize=1)
def load_artifacts():
    metadata = DEFAULT_METADATA
    if METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        except Exception:
            metadata = DEFAULT_METADATA

    features = metadata.get('feature_cols', DEFAULT_METADATA['feature_cols'])
    num_classes = metadata.get('num_classes', 10)

    iso_path = MODEL_DIR / 'isolation_forest_model.joblib'
    iso = None
    if iso_path.exists():
        try:
            iso = joblib.load(iso_path)
        except Exception:
            iso = None

    xgb_path = MODEL_DIR / 'xgboost_classifier.joblib'
    xgb = None
    if xgb_path.exists():
        try:
            xgb = joblib.load(xgb_path)
            # The serialised model may have feature names with trailing whitespace
            # (artefact of how the training DataFrame columns were named).
            # Strip them so they match the clean names produced by feature_engineering.py.
            if hasattr(xgb, 'feature_names_in_'):
                xgb.feature_names_in_ = np.array(
                    [f.strip() for f in xgb.feature_names_in_], dtype=object
                )
            # XGBoost booster internal feature names
            try:
                booster = xgb.get_booster()
                booster.feature_names = [f.strip() for f in booster.feature_names]
            except Exception:
                pass
        except Exception:
            xgb = None

    if iso is None or xgb is None:
        fresh_iso, fresh_xgb = _build_fresh_models(features, num_classes)
        if iso is None: iso = fresh_iso
        if xgb is None: xgb = fresh_xgb

    return iso, xgb, metadata
