"""Notebook-derived physics configuration and rule engine for SkyGuard."""
from __future__ import annotations
from typing import Any, Dict, Optional
import json
from pathlib import Path
import numpy as np
import pandas as pd

REFERENCE_FRACTION = 0.80
TEMP_GLOBAL_MIN = -50.0
TEMP_GLOBAL_MAX = 60.0
RH_GLOBAL_MIN = 0.0
RH_GLOBAL_MAX = 100.0
P_GLOBAL_MIN = 300.0
P_GLOBAL_MAX = 1100.0
TEMP_CLUSTER_BUFFER = 4.0
TEMP_STATION_BUFFER = 2.0
P_TOLERANCE_MIN = 15.0
P_MAD_FACTOR = 6.0

DEFAULT_PHYSICS_CONFIG = {
    "config_version": "1.0",
    "reference_fraction": REFERENCE_FRACTION,
    "global_rules": {
        "temperature_min_c": TEMP_GLOBAL_MIN, "temperature_max_c": TEMP_GLOBAL_MAX,
        "humidity_min_pct": RH_GLOBAL_MIN, "humidity_max_pct": RH_GLOBAL_MAX,
        "pressure_min_hpa": P_GLOBAL_MIN, "pressure_max_hpa": P_GLOBAL_MAX,
    },
    "cluster_rules": {},
    "station_rules": {},
}

def load_physics_config(path: Optional[str | Path] = None) -> Dict[str, Any]:
    candidates = []
    if path:
        candidates.append(Path(path))
    candidates += [Path("models/physics_config.json"), Path(__file__).resolve().parents[2] / "models" / "physics_config.json"]
    for candidate in candidates:
        if candidate.exists():
            with candidate.open("r", encoding="utf-8") as f:
                return json.load(f)
    return DEFAULT_PHYSICS_CONFIG.copy()

class PhysicsEngine:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or DEFAULT_PHYSICS_CONFIG
        self.global_rules = self.config.get("global_rules", DEFAULT_PHYSICS_CONFIG["global_rules"])
        self.cluster_rules = self.config.get("cluster_rules", {})
        self.station_rules = self.config.get("station_rules", {})

    def _station_rule(self, station_id):
        return self.station_rules.get(str(station_id))

    def _cluster_rule(self, cluster):
        return self.cluster_rules.get(str(cluster))

    @staticmethod
    def _finite(value):
        try:
            return float(value) if value is not None and np.isfinite(float(value)) else None
        except (TypeError, ValueError):
            return None

    def evaluate(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        station_id = str(observation.get("station_id", "AWS_001"))
        cluster = str(observation.get("cluster", "__MISSING__"))
        t = self._finite(observation.get("temperature_c"))
        rh = self._finite(observation.get("humidity_pct"))
        p = self._finite(observation.get("pressure_hpa"))
        g = self.global_rules
        station = self._station_rule(station_id)
        cluster_rule = self._cluster_rule(cluster)
        rules, violated = {}, []

        def check(name, value, minimum, maximum, extra=None):
            if value is None:
                result = {"violated": False, "available": False, "value": None, "min": minimum, "max": maximum}
            else:
                result = {"violated": bool(value < minimum or value > maximum), "available": True,
                          "value": value, "min": minimum, "max": maximum}
            if extra: result.update(extra)
            rules[name] = result
            if result["violated"]: violated.append(name)

        check("temperature_global", t, g["temperature_min_c"], g["temperature_max_c"])
        check("humidity_global", rh, g["humidity_min_pct"], g["humidity_max_pct"])
        check("pressure_global", p, g["pressure_min_hpa"], g["pressure_max_hpa"])

        if station:
            if "temperature_min_c" in station:
                check("temperature_station", t, station["temperature_min_c"], station["temperature_max_c"])
            if p is not None and station.get("pressure_baseline_hpa") is not None:
                baseline = float(station["pressure_baseline_hpa"])
                tolerance = float(station.get("pressure_tolerance_hpa", P_TOLERANCE_MIN))
                check("pressure_station", p, baseline - tolerance, baseline + tolerance,
                      {"baseline": baseline, "tolerance": tolerance})
        if cluster_rule:
            check("temperature_cluster", t, cluster_rule["temperature_min_c"], cluster_rule["temperature_max_c"])

        return {"station_id": station_id, "timestamp": observation.get("timestamp"),
                "rules": rules, "violated_rules": violated,
                "physics_violation_count": len(violated)}

def build_physics_config(df: pd.DataFrame) -> Dict[str, Any]:
    """Build the notebook's config from a reference dataframe (first 80% chronologically)."""
    data = df.copy().sort_values("timestamp").reset_index(drop=True)
    timestamps = pd.to_datetime(data["timestamp"], errors="coerce", utc=True).dropna().drop_duplicates().sort_values().reset_index(drop=True)
    if len(timestamps) < 2:
        return DEFAULT_PHYSICS_CONFIG.copy()
    cutoff = timestamps.iloc[min(max(int(len(timestamps) * REFERENCE_FRACTION), 1), len(timestamps)-1)]
    ref = data[data["timestamp"] < cutoff].copy()
    cfg = {"config_version": "1.0", "reference_fraction": REFERENCE_FRACTION,
           "reference_start": ref["timestamp"].min().isoformat(),
           "reference_end": ref["timestamp"].max().isoformat(),
           "holdout_start": cutoff.isoformat(),
           "global_rules": DEFAULT_PHYSICS_CONFIG["global_rules"].copy(),
           "cluster_rules": {}, "station_rules": {}}
    def bounds(s):
        s = pd.to_numeric(s, errors="coerce").dropna()
        return (float(s.quantile(.01)), float(s.quantile(.99))) if not s.empty else (None, None)
    for cluster, group in ref.groupby("cluster"):
        lo, hi = bounds(group["temperature_c"])
        if lo is not None:
            cfg["cluster_rules"][str(cluster)] = {
                "temperature_min_c": round(max(TEMP_GLOBAL_MIN, lo-TEMP_CLUSTER_BUFFER), 2),
                "temperature_max_c": round(min(TEMP_GLOBAL_MAX, hi+TEMP_CLUSTER_BUFFER), 2)}
    for station_id, group in ref.groupby("station_id"):
        tlo, thi = bounds(group["temperature_c"])
        pressure = pd.to_numeric(group["pressure_hpa"], errors="coerce").dropna()
        if pressure.empty: continue
        median = float(pressure.median())
        mad = float(np.median(np.abs(pressure-median)))
        rule = {"station_name": str(group.iloc[0].get("station_name", "")),
                "city": str(group.iloc[0].get("city", "")),
                "cluster": str(group.iloc[0].get("cluster", "")),
                "latitude": float(group.iloc[0].get("latitude", 0.0)),
                "longitude": float(group.iloc[0].get("longitude", 0.0)),
                "pressure_baseline_hpa": round(median, 2),
                "pressure_tolerance_hpa": round(max(P_TOLERANCE_MIN, P_MAD_FACTOR*1.4826*mad), 2)}
        if tlo is not None:
            rule.update({"temperature_min_c": round(max(TEMP_GLOBAL_MIN, tlo-TEMP_STATION_BUFFER),2),
                         "temperature_max_c": round(min(TEMP_GLOBAL_MAX, thi+TEMP_STATION_BUFFER),2)})
        cfg["station_rules"][str(station_id)] = rule
    return cfg
