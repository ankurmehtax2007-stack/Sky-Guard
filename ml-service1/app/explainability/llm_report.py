import os
import json
from pathlib import Path
from typing import Any
import requests
from dotenv import load_dotenv

# Search and load .env from module hierarchy or working directory
_cur = Path(__file__).resolve()
for _dir in [_cur.parent, *_cur.parents, Path.cwd(), *Path.cwd().parents]:
    _env_candidate = _dir / '.env'
    if _env_candidate.is_file():
        load_dotenv(_env_candidate)

def _resolve_key() -> str:
    """Resolve Mistral API key from environment or .env files."""
    key = os.getenv('MISTRAL_API_KEY', '').strip()
    if key:
        return key
    cur = Path(__file__).resolve()
    for parent in [cur.parent, *cur.parents, Path.cwd(), *Path.cwd().parents]:
        env_path = parent / '.env'
        if env_path.is_file():
            try:
                load_dotenv(env_path, override=True)
                key = os.getenv('MISTRAL_API_KEY', '').strip()
                if key:
                    return key
            except Exception:
                pass
    return ''

def get_ai_recommendations_for_improvements(root_cause: str, severity: str = 'NONE', health_score: Any = 100) -> list[str]:
    rc = str(root_cause or '').lower()
    if 'temp' in rc or 'cryo' in rc:
        return [
            "Install aspirated multi-plate solar radiation shielding around the thermistor to eliminate direct and reflected radiative heating biases.",
            "Add high-frequency low-pass RC filtering on the analog-to-digital converter (ADC) line to suppress transient electrical noise spikes.",
            "Implement firmware-level dynamic rate-of-change (dT/dt) sanity checks to flag unnatural instantaneous thermal gradients."
        ]
    elif 'hum' in rc:
        return [
            "Retrofit the relative humidity transducer with a sintered PTFE hydrophobic filter cap to prevent water droplet saturation.",
            "Activate an automated periodic pulse heating cycle on the polymer capacitive element to clear condensation post-rain.",
            "Cross-calibrate humidity telemetry against regional psychrometric wet-bulb baselines to detect early polymer aging."
        ]
    elif 'press' in rc or 'baro' in rc:
        return [
            "Install a Quad-Plate wind-damping static pressure port to eliminate dynamic Bernoulli pressure drops during turbulent wind gusts.",
            "Inspect and renew the internal desiccant cartridge inside the barometer enclosure to prevent moisture condensation on the piezo-resistive diaphragm.",
            "Configure automatic zero-point drift tracking by comparing against the nearest WMO/METAR airport barometric reference."
        ]
    elif 'freeze' in rc or 'stuck' in rc:
        return [
            "Implement a hardware Watchdog Timer (WDT) with automated bus reset logic for the I2C/SPI sensor acquisition loop.",
            "Add telemetry delta checks in station firmware to automatically alert if consecutive readings exhibit zero variance over 3 cycles.",
            "Inspect sensor signal line pull-up resistors and check connectors for oxidation or intermittent wiring contact."
        ]
    elif 'drift' in rc or 'offset' in rc:
        return [
            "Deploy automated spatial peer-comparison algorithms across neighbouring AWS nodes to detect and correct gradual sensor drift.",
            "Perform precision on-site recalibration using a portable NIST-traceable field calibration standard.",
            "Apply temperature-compensated zero-point calibration curves in firmware to account for long-term component aging."
        ]
    elif 'missing' in rc or 'power' in rc or 'comm' in rc:
        return [
            "Upgrade to an MPPT solar charge controller with high-cycle LiFePO4 battery storage to prevent nocturnal power dropouts.",
            "Implement store-and-forward MQTT QoS 1 telemetry with local non-volatile flash caching during network disconnects.",
            "Optimize antenna elevation and inspect RF transmission cabling to improve signal margin and reduce packet loss."
        ]
    elif 'multivariate' in rc or 'spatial' in rc:
        return [
            "Integrate edge-side thermodynamic consistency equations (Magnus-Tetens psychrometric limits) to validate coupled sensor readings.",
            "Verify station siting complies with WMO guidelines (minimum distance from artificial heat sources, pavement, and aerodynamic obstacles).",
            "Audit regional spatial covariance matrices to calibrate dynamic spatial deviation thresholds."
        ]
    elif 'novel' in rc:
        return [
            "Capture uncompressed high-frequency raw sensor telemetry for active learning feedback and offline retrain cycles.",
            "Conduct a comprehensive physical inspection of the station mast, solar shielding, cabling, and grounding system.",
            "Deploy multi-sensor cross-validation to isolate whether the novelty originates from hardware anomaly or an extreme weather event."
        ]
    else:
        return [
            "Maintain standard preventive maintenance schedule and inspect sensor mesh screens for particulate or biological fouling.",
            "Monitor long-term telemetry latency and ensure battery state-of-charge remains within optimal longevity bounds (40% - 80%).",
            "Verify automated MQTT telemetry publishing cadence and maintain periodic end-to-end data pipeline integrity checks."
        ]

def generate_local_narrative(d: dict[str, Any]) -> str:
    station_id = d.get('station_id', 'Unknown Station')
    station_name = d.get('station_name', 'AWS Node')
    city = d.get('city', 'Unknown')
    cluster = d.get('cluster', 'NCR')
    
    root_cause = str(d.get('root_cause') or 'normal')
    decision = str(d.get('decision') or 'normal')
    
    conf = d.get('confidence', 0.95)
    conf_pct = f"{conf * 100:.1f}%" if conf <= 1.0 else f"{conf:.1f}%"
    
    severity = str(d.get('severity') or 'NONE')
    severity_score = float(d.get('severity_score', 0.0))
    health_score = d.get('health_score', 100)
    health_status = str(d.get('health_status') or 'GOOD')
    
    fused_score = float(d.get('fused_anomaly_score', 0.0))
    iso_score = float(d.get('iforest_ml_score', 0.0))
    xgb_score = float(d.get('xgb_anomaly_evidence', 0.0))
    temporal = float(d.get('temporal_evidence', 0.0))
    spatial = float(d.get('spatial_evidence', 0.0))
    physics = float(d.get('physics_evidence_score', 0.0))
    
    temp = d.get('temperature_c', 'N/A')
    hum = d.get('humidity_pct', 'N/A')
    press = d.get('pressure_hpa', 'N/A')
    
    maint = d.get('maintenance', {})
    action = maint.get('recommended_action', 'Continue routine scheduled monitoring.')
    priority = maint.get('engineering_priority', f"{severity} - Nominal")
    
    shap_factors = d.get('shap_factors', [])
    shap_lines = []
    for sf in shap_factors:
        if isinstance(sf, dict):
            feat = sf.get('feature', '')
            stmt = sf.get('human_readable_statement', f"{feat} impacted prediction.")
            shap_lines.append(f"  - **{feat}**: {stmt}")
    shap_text = "\n".join(shap_lines) if shap_lines else "  - Primary sensor telemetry within baseline tolerances."

    improvements = get_ai_recommendations_for_improvements(root_cause, severity, health_score)
    improvement_lines = [f"  - {rec}" for rec in improvements]
    improvement_text = "\n".join(improvement_lines)

    is_anom = decision != 'normal'
    
    if not is_anom:
        summary_text = f"Station **{station_id}** ({station_name}, {city} - {cluster}) is operating within nominal parameters. No anomalies detected."
    else:
        summary_text = f"Station **{station_id}** ({station_name}, {city} - {cluster}) has detected a **{root_cause.replace('_', ' ').title()}** ({decision.upper()}) with {conf_pct} confidence."

    report_lines = [
        f"### 📋 SkyGuard Diagnostic Assessment for {station_id}",
        f"**Station Name**: {station_name} | **Cluster**: {cluster} | **Location**: {city}",
        "",
        "#### 1. Anomaly Summary",
        summary_text,
        "",
        "#### 2. Root Cause Analysis",
        f"- **Diagnosed Condition**: `{root_cause}`",
        f"- **Detection Decision**: `{decision}`",
        f"- **Model Confidence**: {conf_pct}",
        "",
        "#### 3. Multi-Source Evidence",
        f"- **Fused Anomaly Score**: {fused_score:.3f}",
        f"- **XGBoost Evidence**: {xgb_score:.3f} | **Isolation Forest Novelty**: {iso_score:.3f}",
        f"- **Physics Inconsistency Level**: {physics:.2f} (Binned)",
        f"- **Spatial Cluster Deviation**: {spatial:.3f} | **Temporal Persistence**: {temporal:.3f}",
        f"- **Current Observations**: Temp = {temp}°C, Humidity = {hum}%, Pressure = {press} hPa",
        "",
        "#### 4. Feature Importance & SHAP Factors",
        shap_text,
        "",
        "#### 5. Severity & Health Assessment",
        f"- **Severity**: {severity} (Score: {severity_score:.3f})",
        f"- **Sensor Health**: {health_score}/100 ({health_status})",
        "",
        "#### 6. Recommended Maintenance Actions",
        f"- **Priority**: {priority}",
        f"- **Action**: {action}",
        "",
        "#### 7. AI Recommendations for System Improvements",
        improvement_text,
        "",
        "*(SkyGuard Autonomous Meteorological Diagnostic Intelligence Layer)*"
    ]
    return "\n".join(report_lines)

def generate_ai_report(
    diagnostic: dict[str, Any],
    instruction: str = "Explain the incident, recommend maintenance actions, and provide AI recommendations for improvements.",
    generate_report: Any = None,
    only_on_anomaly: bool = True
) -> dict[str, Any]:
    # 0. Check whether report generation is enabled/desired
    if generate_report is None:
        env_val = os.getenv('ENABLE_LLM_REPORT', 'true').strip().lower()
        should_generate = env_val in ('true', '1', 'yes')
    else:
        should_generate = bool(generate_report)

    # Check whether the diagnostic represents an anomaly
    decision = str(diagnostic.get('decision') or (diagnostic.get('anomaly', {}).get('decision') if isinstance(diagnostic.get('anomaly'), dict) else '') or 'normal').lower()
    root_cause = str(diagnostic.get('root_cause') or (diagnostic.get('anomaly', {}).get('root_cause') if isinstance(diagnostic.get('anomaly'), dict) else '') or 'normal').lower()
    anom_detected = bool(diagnostic.get('anomaly', {}).get('detected', False)) if isinstance(diagnostic.get('anomaly'), dict) else False
    is_anom = (decision not in ('normal', 'nominal')) or (root_cause not in ('normal', 'nominal', '')) or anom_detected
    severity = str(diagnostic.get('severity') or (diagnostic.get('anomaly', {}).get('severity') if isinstance(diagnostic.get('anomaly'), dict) else '') or 'NONE')
    health_score = diagnostic.get('health_score') or (diagnostic.get('health', {}).get('score') if isinstance(diagnostic.get('health'), dict) else 100)

    ai_improvements = get_ai_recommendations_for_improvements(root_cause, severity, health_score)

    if not should_generate:
        return {"llm_report": "", "llm_source": "disabled", "ai_recommendations": ai_improvements}

    # Only generate diagnostic report on anomaly if only_on_anomaly is active
    if only_on_anomaly and not is_anom:
        return {"llm_report": "", "llm_source": "skipped_nominal", "ai_recommendations": ai_improvements}

    # 1. Try remote microservice if configured and accessible
    llm_url = os.getenv('LLM_SERVICE_URL', '').rstrip('/')
    if llm_url:
        try:
            r = requests.post(f"{llm_url}/report", json={"diagnostic": diagnostic, "instruction": instruction}, timeout=4)
            if r.ok:
                data = r.json()
                return {
                    "llm_report": data.get("report", ""),
                    "llm_source": data.get("source", "mistral"),
                    "ai_recommendations": ai_improvements
                }
        except Exception:
            pass

    # 2. Try direct Mistral AI API with structured evidence
    key = _resolve_key()
    if key and len(key) > 5:
        base = os.getenv('MISTRAL_BASE_URL', 'https://api.mistral.ai/v1').rstrip('/')
        model = os.getenv('MISTRAL_MODEL', 'mistral-small-latest')
        system = (
            "You are SkyGuard AI reporting layer for automated weather station diagnostics. "
            "You must ONLY use the supplied structured telemetry, ML evidence, physics score, SHAP feature attributions, maintenance recommendations, and AI improvement targets. "
            "Never invent conflicting diagnosis or replace the ML/physics decision logic. "
            "Format the report clearly with the following sections:\n"
            "1. Anomaly Summary\n"
            "2. Root Cause Analysis\n"
            "3. Evidence Explanation (XGBoost, Isolation Forest, Physics, Spatial, Temporal)\n"
            "4. SHAP Feature Attribution Meaning\n"
            "5. Severity & Health Assessment\n"
            "6. Recommended Maintenance Actions\n"
            "7. AI Recommendations for System Improvements"
        )
        
        # Prepare structured input payload for LLM
        structured_summary = {
            "station": {
                "id": diagnostic.get("station_id", "Unknown"),
                "name": diagnostic.get("station_name", "AWS Node"),
                "cluster": diagnostic.get("cluster", "NCR"),
                "city": diagnostic.get("city", "Unknown")
            },
            "telemetry": {
                "temperature_c": diagnostic.get("temperature_c"),
                "humidity_pct": diagnostic.get("humidity_pct"),
                "pressure_hpa": diagnostic.get("pressure_hpa")
            },
            "ml_diagnosis": {
                "decision": diagnostic.get("decision", "normal"),
                "root_cause": diagnostic.get("root_cause", "normal"),
                "confidence": diagnostic.get("confidence", 0.95),
                "fused_anomaly_score": diagnostic.get("fused_anomaly_score", 0.0),
                "xgboost_evidence": diagnostic.get("xgb_anomaly_evidence", 0.0),
                "isolation_forest_novelty": diagnostic.get("iforest_ml_score", 0.0),
                "physics_score": diagnostic.get("physics_evidence_score", 0.0),
                "spatial_evidence": diagnostic.get("spatial_evidence", 0.0),
                "temporal_evidence": diagnostic.get("temporal_evidence", 0.0)
            },
            "shap_factors": diagnostic.get("shap_factors", []),
            "health": {
                "score": health_score,
                "status": diagnostic.get("health_status", "GOOD"),
                "severity": severity
            },
            "maintenance": diagnostic.get("maintenance", {}),
            "ai_improvement_targets": ai_improvements
        }
        
        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': f"{instruction}\n\nStructured Evidence:\n{json.dumps(structured_summary, default=str)}"}
            ],
            'temperature': 0.2
        }
        try:
            r = requests.post(
                f"{base}/chat/completions",
                headers={'Authorization': f"Bearer {key}", 'Content-Type': 'application/json'},
                json=payload,
                timeout=10
            )
            if r.ok:
                data = r.json()
                content = data['choices'][0]['message']['content']
                return {
                    "llm_report": content,
                    "llm_source": "mistral",
                    "ai_recommendations": ai_improvements
                }
        except Exception:
            pass

    # 3. Deterministic Local Narrative Fallback
    local_rep = generate_local_narrative(diagnostic)
    return {
        "llm_report": local_rep,
        "llm_source": "fallback",
        "ai_recommendations": ai_improvements
    }
