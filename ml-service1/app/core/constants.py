ALL_CLASSES = [
    "normal",
    "temperature_spike",
    "humidity_spike",
    "pressure_jump",
    "freeze",
    "drift",
    "offset",
    "missing_data",
    "multivariate_inconsistency",
    "spatial_inconsistency"
]

ANOMALY_CLASSES = ALL_CLASSES[1:]
CLASS_TO_IDX = {v: i for i, v in enumerate(ALL_CLASSES)}
IDX_TO_CLASS = {i: v for i, v in enumerate(ALL_CLASSES)}

DEFAULT_FEATURE_COLS = [
    "temperature_c",
    "humidity_pct",
    "pressure_hpa",
    "hour_sin",
    "hour_cos",
    "month_sin",
    "month_cos",
    "cluster_temp_mean",
    "cluster_temp_std",
    "cluster_press_mean",
    "cluster_press_std",
    "cluster_hum_mean",
    "cluster_hum_std",
    "spatial_temp_zscore",
    "spatial_press_zscore",
    "spatial_hum_zscore",
    "neighbor_dev_score",
    "cluster_anomaly_pct",
    "dewpoint_c",
    "dewpoint_depression_c",
    "temperature_c_diff_lag1",
    "temperature_c_diff_lag24",
    "temperature_c_rate_1h",
    "temperature_c_roll6_mean",
    "temperature_c_roll6_var",
    "temperature_c_frozen_count",
    "temperature_c_roll24_diff",
    "temperature_c_roll24_zscore",
    "humidity_pct_diff_lag1",
    "humidity_pct_diff_lag24",
    "humidity_pct_rate_1h",
    "humidity_pct_roll6_mean",
    "humidity_pct_roll6_var",
    "humidity_pct_frozen_count",
    "humidity_pct_roll24_diff",
    "humidity_pct_roll24_zscore",
    "pressure_hpa_diff_lag1",
    "pressure_hpa_diff_lag24",
    "pressure_hpa_rate_1h",
    "pressure_hpa_roll6_mean",
    "pressure_hpa_roll6_var",
    "pressure_hpa_frozen_count",
    "pressure_hpa_roll24_diff",
    "pressure_hpa_roll24_zscore",
    "cluster_Konkan_Deccan",
    "cluster_NCR",
    "cluster_Tamil_Nadu_Coast",
    "cluster_West_Bengal",
    "cluster___MISSING__"
]

DEFAULT_CLUSTERS = [
    "Konkan_Deccan",
    "NCR",
    "Tamil_Nadu_Coast",
    "West_Bengal",
    "__MISSING__"
]

DEFAULT_PHYSICS_CONFIG = {
    "absolute": {
        "temp_min_c": -40.0, "temp_max_c": 60.0,
        "humidity_min_pct": 0.0, "humidity_max_pct": 100.0,
        "pressure_min_hpa": 870.0, "pressure_max_hpa": 1085.0
    },
    "rate_per_hour": {
        "temperature_c": 12.0, "humidity_pct": 35.0, "pressure_hpa": 6.0
    },
    "dewpoint": {
        "max_depression_c": 45.0, "min_depression_c": -0.5, "supersaturation_tolerance_c": 0.5
    },
    "freeze": {"min_duration_hours": 6.0},
    "weights": {"range": 0.3, "rate": 0.25, "dewpoint": 0.25, "cross_sensor": 0.2}
}

DEFAULT_FUSION_CONFIG = {
    "w_xgboost": 0.45,
    "w_physics": 0.25,
    "w_iforest": 0.15,
    "w_temporal": 0.075,
    "w_spatial": 0.075
}

DEFAULT_DECISION_CONFIG = {
    "anomaly_threshold": 0.40,
    "known_class_threshold": 0.40,
    "novelty_threshold": 0.65
}

DEFAULT_SEVERITY_CONFIG = {
    "weight_anomaly_strength": 0.40,
    "weight_persistence": 0.20,
    "weight_confidence": 0.20,
    "weight_multi_sensor": 0.20,
    "thresholds": {"LOW": 0.0, "MEDIUM": 0.40, "HIGH": 0.65, "CRITICAL": 0.85}
}

DEFAULT_HEALTH_CONFIG = {
    "base_score": 100.0,
    "max_anomaly_deduction": 35.0,
    "max_drift_deduction": 25.0,
    "max_missing_deduction": 20.0,
    "max_physics_deduction": 20.0
}
