def calculate_sensor_health(decision, severity, root, physics, spatial, missing=False, config=None):
    """
    Computes overall sensor health score (0-100), status (GOOD, DEGRADED, POOR, CRITICAL), and penalty breakdown.
    """
    c = config or {}
    base_score = float(c.get('base_score', 100.0))
    max_anomaly = float(c.get('max_anomaly_deduction', 35.0))
    max_drift = float(c.get('max_drift_deduction', 25.0))
    max_missing = float(c.get('max_missing_deduction', 20.0))
    max_physics = float(c.get('max_physics_deduction', 20.0))

    d = {
        'anomaly_severity_penalty': 0.0,
        'drift_offset_penalty': 0.0,
        'missing_dropout_penalty': 0.0,
        'physics_inconsistency_penalty': 0.0
    }

    if decision != 'normal':
        mult = 0.0 if severity == 'LOW' else 0.35 if severity == 'MEDIUM' else 0.70 if severity == 'HIGH' else 1.0
        d['anomaly_severity_penalty'] = round(max_anomaly * mult, 2)

    if root in ('drift', 'offset'):
        d['drift_offset_penalty'] = round(max_drift, 2)

    if root == 'missing_data' or missing:
        d['missing_dropout_penalty'] = round(max_missing, 2)

    d['physics_inconsistency_penalty'] = round(max_physics * min(1.0, float(physics)), 2)

    score = max(0.0, min(100.0, base_score - sum(d.values())))

    if score >= 80.0:
        status = 'GOOD'
    elif score >= 60.0:
        status = 'DEGRADED'
    elif score >= 40.0:
        status = 'POOR'
    else:
        status = 'CRITICAL'

    return {'health_score': round(score, 2), 'status': status, 'deductions': d}
