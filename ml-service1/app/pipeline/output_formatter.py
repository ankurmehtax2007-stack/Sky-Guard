import numpy as np
import pandas as pd
from typing import Dict, Any
from ..health.maintenance import recommend_maintenance

def _clean_val(v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        if np.isnan(v) or np.isinf(v):
            return 0.0
        return float(v)
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    if isinstance(v, np.ndarray):
        return [_clean_val(x) for x in v.tolist()]
    if isinstance(v, (list, tuple)):
        return [_clean_val(x) for x in v]
    if isinstance(v, dict):
        return {k: _clean_val(val) for k, val in v.items()}
    if isinstance(v, (pd.Timestamp, np.datetime64)):
        return v.isoformat() if hasattr(v, "isoformat") else str(v)
    return v

def format_result(r: Dict[str, Any], include_explanation: bool = True, include_maintenance: bool = True) -> Dict[str, Any]:
    root = str(r.get("root_cause", "normal"))
    decision = str(r.get("decision", "normal"))
    sev = str(r.get("severity", "NONE"))
    sev_score = round(float(r.get("severity_score", 0.0)), 4)
    confidence = round(float(r.get("confidence", 0.0)), 4)
    is_anomaly = (decision != "normal") or (root != "normal")

    station_id = str(r.get("station_id", "AWS_001"))
    timestamp = r.get("timestamp")
    if hasattr(timestamp, "isoformat"):
        timestamp_str = timestamp.isoformat()
    elif timestamp is not None:
        timestamp_str = str(timestamp)
    else:
        timestamp_str = pd.Timestamp.now().isoformat()

    prediction_dict = {
        "decision": decision,
        "root_cause": root,
        "is_anomaly": is_anomaly,
        "confidence": confidence
    }

    severity_dict = {
        "level": sev,
        "score": sev_score
    }

    health_dict = {
        "score": round(float(r.get("health_score", 100.0)), 2),
        "status": str(r.get("health_status", "GOOD")),
        "deductions": r.get("health_deductions", {})
    }

    evidence_dict = {
        "iforest_novelty": round(float(r.get("iforest_ml_score", 0.0)), 4),
        "temporal": round(float(r.get("temporal_evidence", 0.0)), 4),
        "spatial": round(float(r.get("spatial_evidence", 0.0)), 4),
        "physics": round(float(r.get("physics_evidence_score", 0.0)), 4),
        "xgboost": round(float(r.get("xgb_anomaly_evidence", 0.0)), 4),
        "fused_anomaly_score": round(float(r.get("fused_anomaly_score", 0.0)), 4)
    }

    explainability_dict = {}
    if include_explanation:
        shap_factors = r.get("shap_factors", [])
        groups = {"Temperature": 0.0, "Humidity": 0.0, "Pressure": 0.0}
        for f in shap_factors:
            name = str(f.get("feature", "")).lower()
            key = "Temperature" if "temp" in name else "Humidity" if "hum" in name else "Pressure" if "press" in name else None
            if key:
                groups[key] += abs(float(f.get("shap_value", 0.0)))
        total = sum(groups.values()) or 1.0
        explainability_dict = {
            "top_sensor_contributions": [
                {"sensor": k, "contribution": round(v / total, 4)}
                for k, v in sorted(groups.items(), key=lambda x: x[1], reverse=True)
            ],
            "shap_factors": shap_factors
        }

    maint_dict = {}
    if include_maintenance:
        maint_dict = recommend_maintenance(root, sev)

    # Combined analysis object for backward-compatibility with backend
    analysis_obj = {
        "anomaly": {
            "detected": is_anomaly,
            "root_cause": root,
            "decision": decision,
            "severity": sev,
            "confidence": confidence,
            "score": sev_score
        },
        "maintenance": maint_dict,
        "health": health_dict,
        "evidence": evidence_dict,
        "explainability": explainability_dict,
        "explanation": explainability_dict
    }

    out = {
        "station_id": station_id,
        "timestamp": timestamp_str,
        "prediction": prediction_dict,
        "severity": severity_dict,
        "health": health_dict,
        "evidence": evidence_dict,
        "explainability": explainability_dict,
        "maintenance": maint_dict,
        "analysis": analysis_obj,
        "llm_report": r.get("llm_report", ""),
        "ai_recommendations": r.get("ai_recommendations", [])
    }

    return {k: _clean_val(v) for k, v in out.items()}
