import numpy as np

def fuse_evidence(iforest_novelty, temporal_evidence, spatial_evidence, physics_evidence, xgb_anomaly_prob, weights=None):
    """
    Combines multi-source evidence channels with weighted non-linear fusion.
    XGBoost is the primary detector (45%), Physics (25%), Isolation Forest (15%), Temporal (7.5%), Spatial (7.5%).
    """
    w = weights or {}
    total = sum(w.values()) if w else 1.0
    if total <= 0: total = 1.0
    w_norm = {k: v / total for k, v in w.items()}

    w_xgb = w_norm.get('w_xgboost', 0.45)
    w_phys = w_norm.get('w_physics', 0.25)
    w_iso = w_norm.get('w_iforest', 0.15)
    w_temp = w_norm.get('w_temporal', 0.075)
    w_spat = w_norm.get('w_spatial', 0.075)

    iso = np.asarray(iforest_novelty, dtype=float)
    temp = np.asarray(temporal_evidence, dtype=float)
    spat = np.asarray(spatial_evidence, dtype=float)
    phys = np.asarray(physics_evidence, dtype=float)
    xgb = np.asarray(xgb_anomaly_prob, dtype=float)

    weighted = (
        w_xgb * xgb +
        w_phys * phys +
        w_iso * iso +
        w_temp * temp +
        w_spat * spat
    )

    # When all active indicators show low probability, keep score nominal
    nominal_mask = (xgb < 0.20) & (phys < 0.20) & (temp < 0.25) & (spat < 0.25)

    # Boost when ML model, physical constraint, temporal pattern, or spatial outlier triggers
    max_evidence = np.maximum.reduce([xgb, phys, temp, spat])
    anom_boost = np.maximum(weighted, 0.75 * max_evidence)
    fused = np.where(nominal_mask, weighted * 0.65, anom_boost)
    return np.clip(np.nan_to_num(fused, nan=0.0), 0.0, 1.0)
