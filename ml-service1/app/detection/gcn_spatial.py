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

def spatial_scores(df: pd.DataFrame, model=None, adjacency=None, station_order=None) -> np.ndarray:
    vals = []
    for _, r in df.iterrows():
        z_t = abs(_safe_float(r.get("spatial_temp_zscore", 0))) / 3.0
        z_p = abs(_safe_float(r.get("spatial_press_zscore", 0))) / 3.0
        z_h = abs(_safe_float(r.get("spatial_hum_zscore", 0))) / 3.0
        score = float(np.clip(max(z_t, z_p, z_h), 0.0, 1.0))
        vals.append(score)

    return np.asarray(vals, dtype=float)
