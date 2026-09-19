import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

from ..preprocessing.cleaner import clean_dataframe
from ..preprocessing.feature_engineering import engineer_features
from ..preprocessing.encoder import to_model_matrix
from ..detection.isolation_forest import score as if_score
from ..detection.xgboost import predict as xgb_predict
from ..detection.physics_rules import evaluate_physics
from ..detection.temporal import temporal_scores
from ..detection.gcn_spatial import spatial_scores
from ..fusion.evidence_fusion import fuse_evidence
from ..fusion.decision_engine import make_decision
from ..health.severity import calculate_severity
from ..health.sensor_health import calculate_sensor_health
from ..explainability.shap_explainer import explain
from .output_formatter import format_result

def run_pipeline(
    records: List[Any],
    iso_model: Any,
    xgb_model: Any,
    metadata: Dict[str, Any],
    include_explanation: bool = True,
    include_maintenance: bool = True,
    generate_report: Optional[bool] = None
) -> List[Dict[str, Any]]:
    if not records:
        return []

    unpacked = [r.model_dump() if hasattr(r, "model_dump") else r for r in records]
    raw = pd.DataFrame(unpacked)
    if raw.empty:
        return []

    raw = clean_dataframe(raw)
    if "cluster" not in raw.columns:
        raw["cluster"] = "NCR"
    else:
        raw["cluster"] = raw["cluster"].fillna("NCR")

    eng = engineer_features(raw)
    features = metadata.get("feature_cols", [])
    X = to_model_matrix(eng, features)

    # 1. Anomaly Detectors
    iso = if_score(iso_model, X)
    probs = xgb_predict(xgb_model, X)
    xgb_anom = 1.0 - probs[:, 0]

    # 2. Physics & Consistency
    phys_cfg = metadata.get("physics_config") or metadata.get("configs", {}).get("physics", {})
    phys = evaluate_physics(eng, phys_cfg)
    phys_score = np.nan_to_num(phys["physics_evidence_score"].to_numpy(), nan=0.0)

    # 3. Temporal & Spatial
    temporal = temporal_scores(eng)
    spatial = spatial_scores(eng)

    # 4. Multi-Source Fusion
    fusion_cfg = metadata.get("fusion_config") or metadata.get("configs", {}).get("fusion", {})
    fused = fuse_evidence(iso, temporal, spatial, phys_score, xgb_anom, fusion_cfg)

    # 5. Diagnostic Decision & Severity
    classes = metadata.get("classes", [])
    decision_cfg = metadata.get("decision_config") or metadata.get("configs", {}).get("decision", {})
    severity_cfg = metadata.get("severity_config") or metadata.get("configs", {}).get("severity", {})
    health_cfg = metadata.get("health_config") or metadata.get("configs", {}).get("health", {})

    results = []
    for i in range(len(eng)):
        row_dict = eng.iloc[i].to_dict()
        phys_row = phys.iloc[i].to_dict()

        d = make_decision(
            float(fused[i]),
            probs[i],
            classes,
            decision_cfg,
            float(iso[i]),
            context=row_dict
        )

        frozen_cnt = int(row_dict.get("temperature_c_frozen_count", 1) or 1)
        p_ev = float(phys_score[i])
        n_dev = float(row_dict.get("neighbor_dev_score", 0.0) or 0.0)

        sev = calculate_severity(
            d["decision"],
            float(fused[i]),
            float(d["confidence"]),
            frozen_cnt,
            p_ev,
            d["root_cause"],
            severity_cfg
        )

        health = calculate_sensor_health(
            d["decision"],
            sev["severity"],
            d["root_cause"],
            p_ev,
            n_dev,
            config=health_cfg
        )

        cls_idx = classes.index(d["root_cause"]) if d["root_cause"] in classes else 0
        shap_f = explain(xgb_model, X.iloc[[i]], features, cls_idx) if include_explanation else []

        combined_record = {
            **row_dict,
            **phys_row,
            "iforest_ml_score": float(iso[i]),
            "xgb_anomaly_evidence": float(xgb_anom[i]),
            "temporal_evidence": float(temporal[i]),
            "spatial_evidence": float(spatial[i]),
            "fused_anomaly_score": float(fused[i]),
            **d,
            **sev,
            "health_score": health["health_score"],
            "health_status": health["status"],
            "health_deductions": health.get("deductions", {}),
            "shap_factors": shap_f
        }

        # Check for on-demand LLM report if requested
        if generate_report:
            try:
                from ..explainability.shap_explainer import generate_ai_report
                rep = generate_ai_report(combined_record, generate_report=True, only_on_anomaly=False)
                combined_record["llm_report"] = rep.get("llm_report", "")
                combined_record["ai_recommendations"] = rep.get("ai_recommendations", [])
            except Exception:
                combined_record["llm_report"] = ""
                combined_record["ai_recommendations"] = []

        formatted = format_result(combined_record, include_explanation, include_maintenance)
        results.append(formatted)

    return results
