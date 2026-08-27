import numpy as np
import pandas as pd

def bin_physics_score(scores):
    """
    Convert a continuous physics anomaly score into simple levels.
    0.00 -> Normal
    0.25 -> Minor anomaly
    0.50 -> Moderate anomaly
    0.75 -> High anomaly
    1.00 -> Critical anomaly
    """
    arr = np.asarray(scores, dtype=float)
    binned = np.select(
        [
            arr < 0.12,
            arr < 0.38,
            arr < 0.65,
            arr < 0.85
        ],
        [
            0.00,
            0.25,
            0.50,
            0.75
        ],
        default=1.00
    )
    return binned

def evaluate_physics(df: pd.DataFrame, cfg: dict = None) -> pd.DataFrame:
    c = cfg or {}

    # 1. Get sensor values
    temperature = df["temperature_c"]
    humidity = df["humidity_pct"]
    pressure = df["pressure_hpa"]

    # 2. Operating limits
    temp_max = min(float(c.get("temp_max_c", 48.0)), 46.0)
    temp_min = max(float(c.get("temp_min_c", -10.0)), -5.0)

    humidity_max = min(float(c.get("humidity_max_pct", 100.0)), 98.0)
    humidity_min = max(float(c.get("humidity_min_pct", 0.0)), 5.0)

    pressure_max = min(float(c.get("pressure_max_hpa", 1080.0)), 1035.0)
    pressure_min = max(float(c.get("pressure_min_hpa", 880.0)), 980.0)

    def range_anomaly(value, minimum, maximum, margin):
        below = np.maximum(minimum - value, 0) / margin
        above = np.maximum(value - maximum, 0) / margin
        return np.clip(below + above, 0, 1)

    # 3. Range Anomaly
    temperature_range = range_anomaly(temperature, temp_min, temp_max, 3.0)
    humidity_range = range_anomaly(humidity, humidity_min, humidity_max, 2.0)
    pressure_range = range_anomaly(pressure, pressure_min, pressure_max, 12.0)

    range_score = np.maximum.reduce([temperature_range, humidity_range, pressure_range])

    # 4. Rate-of-Change Anomaly
    max_temperature_rate = float(c.get("temp_max_rate_c_per_hr", 5.0))
    max_humidity_rate = float(c.get("humidity_max_rate_pct_per_hr", 18.0))
    max_pressure_rate = float(c.get("pressure_max_rate_hpa_per_hr", 3.0))

    t_rate = pd.to_numeric(df["temperature_c_rate_1h"] if "temperature_c_rate_1h" in df.columns else 0.0, errors="coerce").fillna(0.0).astype(float)
    h_rate = pd.to_numeric(df["humidity_pct_rate_1h"] if "humidity_pct_rate_1h" in df.columns else 0.0, errors="coerce").fillna(0.0).astype(float)
    p_rate = pd.to_numeric(df["pressure_hpa_rate_1h"] if "pressure_hpa_rate_1h" in df.columns else 0.0, errors="coerce").fillna(0.0).astype(float)

    temperature_rate = np.abs(t_rate) / (max_temperature_rate + 1e-9)
    humidity_rate = np.abs(h_rate) / (max_humidity_rate + 1e-9)
    pressure_rate = np.abs(p_rate) / (max_pressure_rate + 1e-9)

    rate_score = np.maximum.reduce([temperature_rate, humidity_rate, pressure_rate])
    rate_score = np.clip(np.nan_to_num(rate_score, nan=0.0), 0, 1)

    # 5. Dew-point Depression Anomaly
    dewpoint_depression = df["dewpoint_depression_c"] if "dewpoint_depression_c" in df.columns else (temperature - humidity * 0.2)
    max_depression = float(c.get("max_dewpoint_depression_c", 35.0))
    min_depression = float(c.get("min_dewpoint_depression_c", -0.5))

    dewpoint_low = np.maximum(min_depression - dewpoint_depression, 0) / 2.0
    dewpoint_high = np.maximum(dewpoint_depression - max_depression, 0) / 10.0
    dewpoint_score = np.clip(dewpoint_low + dewpoint_high, 0, 1)

    # 6. Cross-Sensor Anomaly
    high_temperature = np.maximum(temperature - 42.0, 0) / 8.0
    high_humidity = np.maximum(humidity - 85.0, 0) / 15.0
    cross_score = np.clip(high_temperature + high_humidity, 0, 1)

    # 7. Combined Score
    combined_score = (
        0.40 * range_score +
        0.30 * rate_score +
        0.15 * dewpoint_score +
        0.15 * cross_score
    )
    combined_score = np.maximum(combined_score, range_score)
    combined_score = np.clip(np.nan_to_num(combined_score, nan=0.0), 0, 1)

    # 8. Create result with binned levels
    result = pd.DataFrame(index=df.index)
    result["physics_range_score"] = bin_physics_score(range_score)
    result["physics_rate_score"] = bin_physics_score(rate_score)
    result["physics_dewpoint_score"] = bin_physics_score(dewpoint_score)
    result["physics_cross_score"] = bin_physics_score(cross_score)
    result["physics_evidence_score"] = bin_physics_score(combined_score)

    return result.fillna(0.0)