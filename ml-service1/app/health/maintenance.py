from typing import Dict, Any, List

CATALOG: Dict[str, List[str]] = {
    "temperature_spike": [
        "Inspect RTD/thermistor wiring, grounding, solar shield, and ADC channel.",
        "Verify temperature sensor wiring and check for nearby artificial heat sources."
    ],
    "humidity_spike": [
        "Inspect hygrometer element for condensation/contamination and check enclosure seal.",
        "Inspect moisture ingress, desiccant status, and protective filter."
    ],
    "pressure_jump": [
        "Inspect barometric port, vent path, and pressure sensor installation.",
        "Inspect pressure port and compare with nearby stations."
    ],
    "freeze": [
        "Check sensor communication, sampling loop, and stuck-value condition; replace sensor if persistent.",
        "Check for frozen sensor readings, stale buffer, and bus communication faults."
    ],
    "drift": [
        "Compare against a calibrated reference sensor and recalibrate or replace the drifting unit.",
        "Compare against calibrated reference and neighboring station baselines."
    ],
    "offset": [
        "Compare against a calibrated reference and perform zero/offset recalibration.",
        "Verify sensor wiring, reference grounding, and gain calibration."
    ],
    "spatial_inconsistency": [
        "Compare with neighboring stations and inspect station siting, shielding, and physical obstruction.",
        "Audit micro-climate exposure, elevation changes, and sensor placement."
    ],
    "multivariate_inconsistency": [
        "Inspect temperature/humidity sensor pair, enclosure ventilation, and local micro-environment.",
        "Inspect sensor package and cross-sensor correlation wiring."
    ],
    "missing_data": [
        "Inspect power supply, solar battery charging, telemetry logger channel, and network antenna.",
        "Check power, connectivity, and sensor communication protocols."
    ],
    "novel_anomaly": [
        "Perform a comprehensive multi-sensor diagnostic, inspect firmware/logs, and conduct field inspection.",
        "Inspect the station hardware and compare with nearby observations."
    ],
    "normal": [
        "Continue routine scheduled maintenance and automated monitoring."
    ]
}

def recommend_maintenance(root_cause: str, severity: str) -> Dict[str, Any]:
    root = str(root_cause).lower().strip()
    actions = CATALOG.get(root, CATALOG["normal"]) if severity != "NONE" else CATALOG["normal"]
    top_action = actions[0] if actions else "Continue routine scheduled maintenance and monitoring."
    is_required = bool(actions and severity != "NONE" and root != "normal")
    
    return {
        "required": is_required,
        "priority": f"{severity} - High" if is_required and severity in ["HIGH", "CRITICAL"] else severity,
        "actions": actions,
        "recommended_action": top_action
    }
