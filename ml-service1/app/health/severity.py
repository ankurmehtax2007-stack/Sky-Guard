def calculate_severity(decision, fused, confidence, frozen, physics, root, config=None):
    """
    Computes numerical severity score and categorical severity (NONE, LOW, MEDIUM, HIGH, CRITICAL).
    """
    if decision == 'normal':
        return {'severity': 'NONE', 'severity_score': 0.0}

    c = config or {}
    w_strength = float(c.get('weight_anomaly_strength', 0.35))
    w_persist = float(c.get('weight_persistence', 0.25))
    w_conf = float(c.get('weight_confidence', 0.20))
    w_multi = float(c.get('weight_multi_sensor', 0.20))
    thresholds = c.get('thresholds', {
        'LOW': 0.0,
        'MEDIUM': 0.40,
        'HIGH': 0.65,
        'CRITICAL': 0.85
    })

    persistence = min(float(frozen) / 11.0, 1.0)
    multi = 1.0 if root in ('multivariate_inconsistency', 'spatial_inconsistency') else 0.5

    s = (
        w_strength * float(fused) +
        w_persist * persistence +
        w_conf * float(confidence) +
        w_multi * max(multi, float(physics))
    )
    s = max(0.0, min(1.0, s))

    if s >= thresholds.get('CRITICAL', 0.85):
        sev = 'CRITICAL'
    elif s >= thresholds.get('HIGH', 0.65):
        sev = 'HIGH'
    elif s >= thresholds.get('MEDIUM', 0.40):
        sev = 'MEDIUM'
    else:
        sev = 'LOW'

    return {'severity': sev, 'severity_score': round(float(s), 4)}
