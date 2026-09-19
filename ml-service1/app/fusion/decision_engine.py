import numpy as np

DEFAULT_CLASSES = [
    "normal", "temperature_spike", "humidity_spike", "pressure_jump",
    "freeze", "drift", "offset", "missing_data",
    "multivariate_inconsistency", "spatial_inconsistency"
]

def _safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        if isinstance(val, (int, float)):
            return float(val) if not np.isnan(val) else default
        return float(val)
    except Exception:
        return default

def _safe_int(val, default=1):
    if val is None:
        return default
    try:
        if isinstance(val, (int, float)):
            return int(val) if not np.isnan(val) else default
        return int(val)
    except Exception:
        return default

def make_decision(fused, probs, classes=None, config=None, iforest=0.0, context=None):
    """
    Evaluates fused evidence score and multi-class probability vector to make the final diagnosis.
    """
    c = config or {}
    anomaly_threshold = float(c.get('anomaly_threshold', 0.35))
    known_class_threshold = float(c.get('known_class_threshold', 0.38))
    novelty_threshold = float(c.get('novelty_threshold', 0.65))
    class_names = list(classes) if classes else DEFAULT_CLASSES

    probs = np.asarray(probs, dtype=float)
    normal = float(probs[0]) if len(probs) > 0 else 0.5
    anom = probs[1:] if len(probs) > 1 else np.array([0.0])

    if len(anom) > 0:
        idx = int(np.argmax(anom) + 1)
        conf = float(anom[idx - 1])
    else:
        idx = 0
        conf = 0.0

    root_cause_name = class_names[idx] if idx < len(class_names) else f"class_{idx}"
    ctx = context or {}

    # Extract contextual signals for fallback resolution
    f_count = max(
        _safe_int(ctx.get('temperature_c_frozen_count'), 1),
        _safe_int(ctx.get('humidity_pct_frozen_count'), 1),
        _safe_int(ctx.get('pressure_hpa_frozen_count'), 1)
    )
    spat_z = max(
        abs(_safe_float(ctx.get('spatial_temp_zscore'))),
        abs(_safe_float(ctx.get('spatial_press_zscore'))),
        abs(_safe_float(ctx.get('spatial_hum_zscore')))
    )
    t_rate = abs(_safe_float(ctx.get('temperature_c_rate_1h')))
    p_rate = abs(_safe_float(ctx.get('pressure_hpa_rate_1h')))
    press_val = _safe_float(ctx.get('pressure_hpa'), 1013.25)
    temp_val = _safe_float(ctx.get('temperature_c'), 25.0)
    hum_val = _safe_float(ctx.get('humidity_pct'), 50.0)

    # Check direct physical or temporal anomaly conditions
    is_frozen = f_count >= 4
    is_spatial = spat_z >= 3.0
    is_press_jump = press_val < 980.0 or p_rate >= 3.0
    is_drift = (t_rate >= 4.0 and temp_val > 32.0) or t_rate >= 6.0
    is_temp_spike = temp_val > 46.0 or temp_val < -5.0
    is_hum_spike = hum_val >= 98.0
    is_multi_conflict = (temp_val >= 42.0 and hum_val >= 85.0)

    # 1. Known anomaly detected with high XGBoost confidence
    if conf >= known_class_threshold and (fused >= anomaly_threshold or conf >= 0.50 or normal < 0.50):
        if is_spatial and root_cause_name in ['temperature_spike', 'normal', 'known_anomaly'] and not is_temp_spike:
            root_cause_name = 'spatial_inconsistency'
        return {
            'decision': 'known_anomaly',
            'root_cause': root_cause_name,
            'confidence': round(conf, 4)
        }

    # 2. Anomaly triggered via evidence fusion with contextual root cause assignment
    if fused >= anomaly_threshold or is_frozen or is_spatial or is_press_jump or is_drift or is_temp_spike or is_hum_spike or is_multi_conflict:
        assigned_cause = root_cause_name if (root_cause_name not in ['normal', 'known_anomaly', 'novel_anomaly'] and conf >= 0.35) else None
        
        if not assigned_cause:
            if is_frozen:
                assigned_cause = 'freeze'
            elif is_press_jump:
                assigned_cause = 'pressure_jump'
            elif is_temp_spike:
                assigned_cause = 'temperature_spike'
            elif is_hum_spike:
                assigned_cause = 'humidity_spike'
            elif is_multi_conflict:
                assigned_cause = 'multivariate_inconsistency'
            elif is_spatial:
                assigned_cause = 'spatial_inconsistency'
            elif is_drift:
                assigned_cause = 'offset' if t_rate >= 7.0 else 'drift'
            else:
                assigned_cause = root_cause_name if root_cause_name != 'normal' else 'novel_anomaly'

        assigned_conf = max(conf, 0.88 if assigned_cause in ['freeze', 'pressure_jump', 'drift', 'offset', 'spatial_inconsistency', 'multivariate_inconsistency', 'temperature_spike', 'humidity_spike'] else 0.75)

        return {
            'decision': 'known_anomaly' if assigned_cause != 'novel_anomaly' else 'novel_anomaly',
            'root_cause': assigned_cause,
            'confidence': round(float(assigned_conf), 4)
        }

    # 3. Novelty detection
    if iforest >= novelty_threshold and fused >= anomaly_threshold:
        return {
            'decision': 'novel_anomaly',
            'root_cause': 'novel_anomaly',
            'confidence': round(float(max(iforest, 1.0 - normal)), 4)
        }

    # 4. Nominal operation
    return {
        'decision': 'normal',
        'root_cause': 'normal',
        'confidence': round(max(normal, 1.0 - fused), 4)
    }
