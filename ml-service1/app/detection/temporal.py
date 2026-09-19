import numpy as np
import pandas as pd

def _safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        f = float(val)
        return default if np.isnan(f) or np.isinf(f) else f
    except Exception:
        return default

def temporal_scores(df: pd.DataFrame) -> np.ndarray:
    vals = []
    for _, r in df.iterrows():
        z_t = abs(_safe_float(r.get("temperature_c_roll24_zscore", 0))) / 3.5
        z_h = abs(_safe_float(r.get("humidity_pct_roll24_zscore", 0))) / 3.5
        z_p = abs(_safe_float(r.get("pressure_hpa_roll24_zscore", 0))) / 3.5
        z = max(z_t, z_h, z_p)

        r_t = abs(_safe_float(r.get("temperature_c_rate_1h", 0))) / 6.0
        r_h = abs(_safe_float(r.get("humidity_pct_rate_1h", 0))) / 20.0
        r_p = abs(_safe_float(r.get("pressure_hpa_rate_1h", 0))) / 3.0
        rate = max(r_t, r_h, r_p)

        f_t = _safe_float(r.get("temperature_c_frozen_count", 1)) >= 4.0
        f_h = _safe_float(r.get("humidity_pct_frozen_count", 1)) >= 4.0
        f_p = _safe_float(r.get("pressure_hpa_frozen_count", 1)) >= 4.0
        frozen = max(float(f_t), float(f_h), float(f_p)) * 0.90

        score = float(np.clip(max(z, rate, frozen), 0.0, 1.0))
        vals.append(score)

    return np.asarray(vals, dtype=float)
