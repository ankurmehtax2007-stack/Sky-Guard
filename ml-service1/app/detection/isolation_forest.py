import numpy as np

def score(model, X):
    if model is None:
        return np.zeros(len(X), dtype=float)
    try:
        if hasattr(model, 'decision_function'):
            raw = np.asarray(model.decision_function(X), dtype=float)
        elif callable(model):
            raw = np.asarray(model(X), dtype=float)
        else:
            return np.zeros(len(X), dtype=float)

        # Sigmoid calibration: raw > 0 is normal, raw < 0 is anomaly
        calibrated = 1.0 / (1.0 + np.exp(8.0 * raw))
        return np.clip(np.nan_to_num(calibrated, nan=0.1), 0.0, 1.0)
    except Exception:
        return np.zeros(len(X), dtype=float)
