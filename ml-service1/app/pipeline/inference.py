import numpy as np
import pandas as pd
from ..preprocessing.cleaner import clean_dataframe
from ..preprocessing.feature_engineering import engineer_features, to_model_matrix
from ..detection.isolation_forest import score as if_score
from ..detection.xgboost import predict as xgb_predict
from ..detection.physics_rules import evaluate_physics
from ..fusion.evidence_fusion import fuse_evidence
from ..fusion.decision_engine import make_decision
from ..health.severity import calculate_severity
from ..health.sensor_health import calculate_sensor_health
from ..explainability.shap_explainer import explain
from ..explainability.llm_report import generate_ai_report
from .maintenance import recommend_maintenance

def sanitize_record(r):
    out = {}
    for k, v in r.items():
        if isinstance(v, (np.floating, np.integer)):
            v = v.item()
        elif isinstance(v, (np.bool_, bool)):
            v = bool(v)
        elif isinstance(v, np.ndarray):
            v = v.tolist()
        elif isinstance(v, pd.Timestamp):
            v = v.isoformat()
        elif isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
            v = 0.0
        out[k] = v
    return out

def run_pipeline(records, iso_model, xgb_model, metadata, generate_llm=None):
    """
    Pure functional end-to-end execution of the SkyGuard ML diagnostics pipeline.
    """
    if not records:
        return []

    features = metadata.get('feature_cols', [])
    classes = metadata.get('classes', [])
    physics_cfg = metadata.get('physics_config', {})
    fusion_cfg = metadata.get('fusion_config', {})
    decision_cfg = metadata.get('decision_config', {})
    severity_cfg = metadata.get('severity_config', {})
    health_cfg = metadata.get('health_config', {})

    raw = pd.DataFrame(records)
    raw = clean_dataframe(raw)

    if 'cluster' not in raw.columns:
        raw['cluster'] = 'NCR'

    eng = engineer_features(raw)
    X = to_model_matrix(eng, features)

    iso = if_score(iso_model, X)
    probs = xgb_predict(xgb_model, X)
    xgb_anom = 1.0 - probs[:, 0]

    phys = evaluate_physics(eng, physics_cfg)

    z_roll24 = np.maximum.reduce([
        np.nan_to_num(eng['temperature_c_roll24_zscore'].abs().to_numpy() / 3.0, nan=0.0),
        np.nan_to_num(eng['pressure_hpa_roll24_zscore'].abs().to_numpy() / 3.0, nan=0.0),
        np.nan_to_num(eng['humidity_pct_roll24_zscore'].abs().to_numpy() / 3.0, nan=0.0)
    ])
    
    t_rate_score = np.nan_to_num(eng['temperature_c_rate_1h'].abs().to_numpy() / 5.0, nan=0.0)
    p_rate_score = np.nan_to_num(eng['pressure_hpa_rate_1h'].abs().to_numpy() / 3.0, nan=0.0)
    h_rate_score = np.nan_to_num(eng['humidity_pct_rate_1h'].abs().to_numpy() / 18.0, nan=0.0)
    rates = np.maximum.reduce([t_rate_score, p_rate_score, h_rate_score])

    frozen_flag = np.maximum.reduce([
        (eng['temperature_c_frozen_count'].to_numpy() >= 4).astype(float) * 0.90,
        (eng['humidity_pct_frozen_count'].to_numpy() >= 4).astype(float) * 0.90,
        (eng['pressure_hpa_frozen_count'].to_numpy() >= 4).astype(float) * 0.90
    ])
    temporal = np.clip(np.maximum.reduce([z_roll24, rates, frozen_flag]), 0.0, 1.0)

    z_spatial = np.maximum.reduce([
        np.nan_to_num(eng['spatial_temp_zscore'].abs().to_numpy() / 3.0, nan=0.0),
        np.nan_to_num(eng['spatial_press_zscore'].abs().to_numpy() / 3.0, nan=0.0),
        np.nan_to_num(eng['spatial_hum_zscore'].abs().to_numpy() / 3.0, nan=0.0)
    ])
    spatial = np.clip(z_spatial, 0.0, 1.0)

    phys_score = np.nan_to_num(phys['physics_evidence_score'].to_numpy(), nan=0.0)
    fused = fuse_evidence(iso, temporal, spatial, phys_score, xgb_anom, fusion_cfg)

    results = []
    for i in range(len(eng)):
        row_dict = eng.iloc[i].to_dict()
        d = make_decision(float(fused[i]), probs[i], classes, decision_cfg, float(iso[i]), context=row_dict)

        raw_f = eng.iloc[i].get('temperature_c_frozen_count', 1)
        f_count = int(raw_f) if (raw_f is not None and not pd.isna(raw_f)) else 1

        raw_pev = phys.iloc[i].get('physics_evidence_score', 0.0)
        p_ev = float(raw_pev) if (raw_pev is not None and not pd.isna(raw_pev)) else 0.0

        raw_ndev = eng.iloc[i].get('neighbor_dev_score', 0.0)
        n_dev = float(raw_ndev) if (raw_ndev is not None and not pd.isna(raw_ndev)) else 0.0

        sev = calculate_severity(
            d['decision'], float(fused[i]), float(d['confidence']),
            f_count, p_ev, d['root_cause'], severity_cfg
        )

        h = calculate_sensor_health(
            d['decision'], sev['severity'], d['root_cause'],
            p_ev, n_dev, config=health_cfg
        )

        cls_idx = classes.index(d['root_cause']) if d['root_cause'] in classes else 0
        shap_f = explain(xgb_model, X.iloc[[i]], features, cls_idx)
        maint = recommend_maintenance(d['root_cause'], sev['severity'])

        r = {
            **eng.iloc[i].to_dict(),
            **phys.iloc[i].to_dict(),
            'iforest_ml_score': round(float(iso[i]), 4),
            'xgboost': round(float(xgb_anom[i]), 4),
            'xgb_anomaly_evidence': round(float(xgb_anom[i]), 4),
            'temporal_evidence': round(float(temporal[i]), 4),
            'spatial_evidence': round(float(spatial[i]), 4),
            'fused_anomaly_score': round(float(fused[i]), 4),
            **d,
            **sev,
            'health_score': h['health_score'],
            'health_status': h['status'],
            'health_deductions': h['deductions'],
            'shap_factors': shap_f,
            'maintenance': maint
        }

        # Check if record or caller requested LLM report generation
        rec_gen = r.get('generate_report', r.get('generate_llm', generate_llm))
        is_anom = (d['decision'] != 'normal') or (d['root_cause'] != 'normal')

        if is_anom and (rec_gen is True):
            ai_rep = generate_ai_report(r, generate_report=True, only_on_anomaly=True)
            r['llm_report'] = ai_rep.get('llm_report', '')
            r['llm_source'] = ai_rep.get('llm_source', 'mistral')
        else:
            r['llm_report'] = ''
            r['llm_source'] = 'skipped' if not is_anom else 'on_demand'

        results.append(sanitize_record(r))

    return results
