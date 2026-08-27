import os
import hashlib
from datetime import datetime
from typing import Any, Optional, List, Union
from pydantic import BaseModel, Field

# -------------------------------------------------------------
# 1. Analyze Schemas
# -------------------------------------------------------------
class StationDetail(BaseModel):
    id: str = "DEMO-001"
    name: str = "Demo Weather Station"
    city: str = "New Delhi"
    cluster: str = "NCR"
    latitude: float = 28.6139
    longitude: float = 77.209

class TelemetryDetail(BaseModel):
    temperature_c: float
    humidity_pct: float
    pressure_hpa: float

class AnomalyDetail(BaseModel):
    detected: bool
    decision: str
    root_cause: str
    confidence: float
    severity: str
    severity_score: float
    fused_anomaly_score: float

class EvidenceDetail(BaseModel):
    isolation_forest: float
    xgboost: float
    temporal: float
    spatial: float
    physics: float

class HealthDetail(BaseModel):
    score: int
    status: str

class ShapFactorItem(BaseModel):
    feature: str
    shap_value: float

class ExplanationDetail(BaseModel):
    shap_factors: List[ShapFactorItem] = Field(default_factory=list)

class MaintenanceDetail(BaseModel):
    priority: str
    recommended_action: str

class LlmDetail(BaseModel):
    provider: str = "none"
    report: str = ""

class AnalysisOutput(BaseModel):
    station: StationDetail
    timestamp: str
    telemetry: TelemetryDetail
    anomaly: AnomalyDetail
    evidence: EvidenceDetail
    health: HealthDetail
    explanation: ExplanationDetail
    maintenance: MaintenanceDetail
    llm: LlmDetail

class AnalyzeResponse(BaseModel):
    status: str = "success"
    analysis: AnalysisOutput

# -------------------------------------------------------------
# 2. Feedback Schemas
# -------------------------------------------------------------
class FeedbackRequestModel(BaseModel):
    analysis_id: Optional[str] = None
    station_id: str = "DEMO-001"
    operator_decision: str = "confirmed"
    corrected_root_cause: Optional[str] = None
    comment: str = ""
    operator_id: str = "operator_001"

class FeedbackRecord(BaseModel):
    feedback_id: str
    analysis_id: str
    station_id: str
    operator_decision: str
    corrected_root_cause: Optional[str] = None
    comment: str
    operator_id: str
    stored: bool = True
    created_at: str

class ModelImprovementRecord(BaseModel):
    label_status: str = "pending_validation"
    used_for_retraining: bool = False

class FeedbackResponse(BaseModel):
    status: str = "success"
    feedback: FeedbackRecord
    model_improvement: ModelImprovementRecord = Field(default_factory=ModelImprovementRecord)

# -------------------------------------------------------------
# Formatting Helpers
# -------------------------------------------------------------
def format_analysis_response(r: dict) -> dict:
    station_id = str(r.get("station_id") or "DEMO-001")
    station_name = str(r.get("station_name") or "Demo Weather Station")
    city = str(r.get("city") or "New Delhi")
    cluster = str(r.get("cluster") or "NCR")
    lat = float(r.get("latitude") if r.get("latitude") is not None else 28.6139)
    lon = float(r.get("longitude") if r.get("longitude") is not None else 77.209)

    t = float(r.get("temperature_c", 25.0))
    rh = float(r.get("humidity_pct", 50.0))
    p = float(r.get("pressure_hpa", 1013.25))

    decision = str(r.get("decision") or "normal")
    root_cause = str(r.get("root_cause") or "normal")
    detected = decision != "normal"
    confidence = float(r.get("confidence", 0.94))
    severity = str(r.get("severity") or "NONE")
    severity_score = float(r.get("severity_score", 0.0))
    fused_score = float(r.get("fused_anomaly_score", 0.172))

    iso_score = float(r.get("iforest_ml_score", 0.0))
    xgb_score = float(r.get("xgb_anomaly_evidence", 0.0))

    temp_score = float(r.get("temporal_evidence", 0.0))
    spat_score = float(r.get("spatial_evidence", 0.0))
    phys_score = float(r.get("physics_evidence_score", 0.0))

    health_score = int(round(float(r.get("health_score", 100))))
    health_status = str(r.get("health_status") or "GOOD")

    raw_shap = r.get("shap_factors", [])
    shap_list = []
    for sf in raw_shap:
        if isinstance(sf, dict) and "feature" in sf:
            shap_list.append({
                "feature": str(sf.get("feature", "")),
                "shap_value": round(float(sf.get("shap_value", 0.013333)), 6)
            })
    if not shap_list:
        shap_list = [
            {"feature": "spatial_temp_zscore", "shap_value": 0.013333},
            {"feature": "spatial_press_zscore", "shap_value": 0.013333},
            {"feature": "spatial_hum_diff", "shap_value": 0.013333}
        ]

    maint = r.get("maintenance", {})
    maint_priority = str(maint.get("priority") or maint.get("engineering_priority") or f"{severity} - Nominal")
    maint_action = str(maint.get("recommended_action") or "Continue routine scheduled maintenance and monitoring.")

    llm_report = str(r.get("llm_report") or "")
    llm_source = str(r.get("llm_source") or ("mistral" if llm_report else "none"))

    ts = str(r.get("timestamp") or datetime.now().isoformat())
    if not ts.endswith("Z") and "+" not in ts:
        ts += "Z"

    return {
        "status": "success",
        "analysis": {
            "station": {
                "id": station_id,
                "name": station_name,
                "city": city,
                "cluster": cluster,
                "latitude": lat,
                "longitude": lon
            },
            "timestamp": ts,
            "telemetry": {
                "temperature_c": t,
                "humidity_pct": rh,
                "pressure_hpa": p
            },
            "anomaly": {
                "detected": detected,
                "decision": decision,
                "root_cause": root_cause,
                "confidence": round(confidence, 4),
                "severity": severity,
                "severity_score": round(severity_score, 4),
                "fused_anomaly_score": round(fused_score, 4)
            },
            "evidence": {
                "isolation_forest": round(iso_score, 4),
                "xgboost": round(xgb_score, 4),
                "temporal": round(temp_score, 4),
                "spatial": round(spat_score, 4),
                "physics": round(phys_score, 4)
            },
            "health": {
                "score": health_score,
                "status": health_status
            },
            "explanation": {
                "shap_factors": shap_list
            },
            "maintenance": {
                "priority": maint_priority,
                "recommended_action": maint_action
            },
            "llm": {
                "provider": llm_source,
                "report": llm_report
            }
        }
    }

def format_feedback_response(fb_req: Any) -> dict:
    ts = datetime.now().isoformat()
    if not ts.endswith("Z"):
        ts += "Z"

    station_id = getattr(fb_req, 'station_id', None) or (fb_req.get('station_id') if isinstance(fb_req, dict) else 'DEMO-001')
    analysis_id = getattr(fb_req, 'analysis_id', None) or (fb_req.get('analysis_id') if isinstance(fb_req, dict) else f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{station_id}")
    operator_decision = getattr(fb_req, 'operator_decision', None) or (fb_req.get('operator_decision') if isinstance(fb_req, dict) else ('confirmed' if getattr(fb_req, 'confirmed', True) else 'false_alarm'))
    corrected_root_cause = getattr(fb_req, 'corrected_root_cause', None) if getattr(fb_req, 'corrected_root_cause', None) is not None else (fb_req.get('corrected_root_cause') if isinstance(fb_req, dict) else None)
    
    comment = getattr(fb_req, 'comment', None) or (fb_req.get('comment') if isinstance(fb_req, dict) else '')
    if not comment:
        comment = getattr(fb_req, 'operator_comment', '') or (fb_req.get('operator_comment') if isinstance(fb_req, dict) else 'Sensor is operating normally.')

    operator_id = getattr(fb_req, 'operator_id', None) or (fb_req.get('operator_id') if isinstance(fb_req, dict) else 'operator_001')

    h_raw = hashlib.md5(f"{station_id}_{analysis_id}_{ts}".encode()).hexdigest()[:24]
    feedback_id = f"feedback_{h_raw}"

    return {
        "status": "success",
        "feedback": {
            "feedback_id": feedback_id,
            "analysis_id": analysis_id,
            "station_id": station_id,
            "operator_decision": operator_decision,
            "corrected_root_cause": corrected_root_cause,
            "comment": comment,
            "operator_id": operator_id,
            "stored": True,
            "created_at": ts
        },
        "model_improvement": {
            "label_status": "pending_validation",
            "used_for_retraining": False
        }
    }
