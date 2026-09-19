import json
import joblib
import numpy as np
from functools import lru_cache
from pathlib import Path
from typing import Tuple, Any, Dict

from .config import MODEL_DIR, METADATA_PATH
from ..detection.physics_config import load_physics_config
from .constants import (
    ALL_CLASSES,
    DEFAULT_FEATURE_COLS,
    DEFAULT_PHYSICS_CONFIG,
    DEFAULT_FUSION_CONFIG,
    DEFAULT_DECISION_CONFIG,
    DEFAULT_SEVERITY_CONFIG,
    DEFAULT_HEALTH_CONFIG
)
from .logger import logger

def _safe_load_joblib(path: Path) -> Any:
    if path.exists() and path.is_file():
        try:
            return joblib.load(path)
        except Exception as e:
            logger.warning(f"Failed to load joblib model from {path}: {e}")
            return None
    return None

def heuristic_iso_predict(X):
    arr = np.asarray(X, dtype=float)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    t = arr[:, 0] if arr.shape[1] > 0 else 25.0
    rh = arr[:, 1] if arr.shape[1] > 1 else 50.0
    p = arr[:, 2] if arr.shape[1] > 2 else 1013.25
    dev_t = np.maximum(0.0, np.abs(t - 28.5) - 13.0) / 10.0
    dev_rh = np.maximum(0.0, np.abs(rh - 55.0) - 35.0) / 15.0
    dev_p = np.maximum(0.0, np.abs(p - 1008.0) - 25.0) / 15.0
    total_dev = dev_t + dev_rh + dev_p
    return np.where(total_dev > 0.05, -0.10 - total_dev * 0.45, 0.22 - total_dev * 0.2)

def heuristic_xgb_predict(X, num_classes=len(ALL_CLASSES)):
    arr = np.asarray(X, dtype=float)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    n = len(arr)
    probs = np.zeros((n, num_classes), dtype=float)
    for i in range(n):
        t = arr[i, 0] if arr.shape[1] > 0 else 25.0
        rh = arr[i, 1] if arr.shape[1] > 1 else 50.0
        p = arr[i, 2] if arr.shape[1] > 2 else 1013.25
        t_z = arr[i, 13] if arr.shape[1] > 13 else (t - 28.5) / 5.5
        frozen_count = arr[i, 25] if arr.shape[1] > 25 else 1.0

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
            probs[i, 8 if num_classes > 8 else 6] = 0.88
            probs[i, 0] = 0.12
        elif abs(t_z) >= 3.5:
            probs[i, 9 if num_classes > 9 else 7] = 0.85
            probs[i, 0] = 0.15
        else:
            probs[i, 0] = 0.95
            probs[i, 1:] = 0.05 / max(1, (num_classes - 1))
    return probs

@lru_cache(maxsize=1)
def load_artifacts() -> Tuple[Any, Any, Dict[str, Any]]:
    meta: Dict[str, Any] = {}
    
    metadata_candidates = [
        METADATA_PATH,
        MODEL_DIR / "pipeline_metadata.json",
        MODEL_DIR / "pipeline_metadata (1).json"
    ]
    
    for candidate in metadata_candidates:
        if candidate.exists() and candidate.is_file():
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                logger.info(f"Loaded metadata from {candidate.name}")
                break
            except Exception as e:
                logger.warning(f"Error reading metadata from {candidate}: {e}")
                
    # Normalize nested config dictionaries
    configs = meta.get("configs", {})
    if configs:
        meta.setdefault("physics_config", configs.get("physics", DEFAULT_PHYSICS_CONFIG))
        meta.setdefault("fusion_config", configs.get("fusion", DEFAULT_FUSION_CONFIG))
        meta.setdefault("decision_config", configs.get("decision", DEFAULT_DECISION_CONFIG))
        meta.setdefault("severity_config", configs.get("severity", DEFAULT_SEVERITY_CONFIG))
        meta.setdefault("health_config", configs.get("health", DEFAULT_HEALTH_CONFIG))
    else:
        meta.setdefault("physics_config", load_physics_config())
        meta.setdefault("fusion_config", DEFAULT_FUSION_CONFIG)
        meta.setdefault("decision_config", DEFAULT_DECISION_CONFIG)
        meta.setdefault("severity_config", DEFAULT_SEVERITY_CONFIG)
        meta.setdefault("health_config", DEFAULT_HEALTH_CONFIG)

    meta.setdefault("classes", ALL_CLASSES)
    meta.setdefault("num_classes", len(meta["classes"]))
    
    feature_cols = meta.get("feature_cols")
    if not feature_cols:
        meta["feature_cols"] = DEFAULT_FEATURE_COLS
    else:
        meta["feature_cols"] = [str(c).strip() for c in feature_cols]

    # Load Isolation Forest
    iso = (
        _safe_load_joblib(MODEL_DIR / "isolation_forest_model.joblib") or
        _safe_load_joblib(MODEL_DIR / "isolation_forest_model (1).joblib")
    )
    if iso is None:
        logger.warning("Isolation Forest checkpoint not found or unreadable; using calibrated heuristic fallback.")
        iso = heuristic_iso_predict

    # Load XGBoost Classifier
    xgb = (
        _safe_load_joblib(MODEL_DIR / "xgboost_classifier.joblib") or
        _safe_load_joblib(MODEL_DIR / "xgboost_classifier (1).joblib")
    )
    if xgb is not None:
        # Sanitize whitespace in feature names
        try:
            if hasattr(xgb, "feature_names_in_"):
                xgb.feature_names_in_ = np.array([f.strip() for f in xgb.feature_names_in_], dtype=object)
        except Exception:
            pass
        try:
            booster = xgb.get_booster()
            if booster.feature_names:
                booster.feature_names = [f.strip() for f in booster.feature_names]
        except Exception:
            pass
    else:
        logger.warning("XGBoost classifier checkpoint not found or unreadable; using calibrated heuristic fallback.")
        xgb = heuristic_xgb_predict

    return iso, xgb, meta
