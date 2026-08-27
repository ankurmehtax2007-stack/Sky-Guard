import os
import json
from pathlib import Path
from typing import Any
import requests
from dotenv import load_dotenv

load_dotenv()

def _resolve_key() -> str:
    key = os.getenv('MISTRAL_API_KEY', '').strip()
    if key:
        return key
    cur = Path(__file__).resolve()
    for parent in [cur.parent, *cur.parents, Path.cwd(), *Path.cwd().parents]:
        env_path = parent / '.env'
        if env_path.exists() and env_path.is_file():
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith('MISTRAL_API_KEY='):
                            val = line.split('=', 1)[1].strip().strip('"').strip("'")
                            if val:
                                os.environ['MISTRAL_API_KEY'] = val
                                return val
            except Exception:
                pass
    default_key = 'K53ATfhFHMqEfyX14hv7VF1LdHmjkqC5'
    os.environ['MISTRAL_API_KEY'] = default_key
    return default_key

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
        "*(SkyGuard Autonomous Meteorological Diagnostic Intelligence Layer)*"
    ]
    return "\n".join(report_lines)

def generate_ai_report(
    diagnostic: dict[str, Any],
    instruction: str = "Explain the incident and recommend safe maintenance actions.",
    generate_report: Any = None,
    only_on_anomaly: bool = True
) -> dict[str, str]:
    # 0. Check whether report generation is enabled/desired
    if generate_report is None:
        env_val = os.getenv('ENABLE_LLM_REPORT', 'true').strip().lower()
        should_generate = env_val in ('true', '1', 'yes')
    else:
        should_generate = bool(generate_report)

    if not should_generate:
        return {"llm_report": "", "llm_source": "disabled"}

    # Check whether the diagnostic represents an anomaly
    decision = str(diagnostic.get('decision') or (diagnostic.get('anomaly', {}).get('decision') if isinstance(diagnostic.get('anomaly'), dict) else '') or 'normal').lower()
    root_cause = str(diagnostic.get('root_cause') or (diagnostic.get('anomaly', {}).get('root_cause') if isinstance(diagnostic.get('anomaly'), dict) else '') or 'normal').lower()
    anom_detected = bool(diagnostic.get('anomaly', {}).get('detected', False)) if isinstance(diagnostic.get('anomaly'), dict) else False
    is_anom = (decision not in ('normal', 'nominal')) or (root_cause not in ('normal', 'nominal', '')) or anom_detected

    # Only generate diagnostic report on anomaly if only_on_anomaly is active
    if only_on_anomaly and not is_anom:
        return {"llm_report": "", "llm_source": "skipped_nominal"}

    # 1. Try remote microservice if configured and accessible
    llm_url = os.getenv('LLM_SERVICE_URL', '').rstrip('/')
    if llm_url:
        try:
            r = requests.post(f"{llm_url}/report", json={"diagnostic": diagnostic, "instruction": instruction}, timeout=4)
            if r.ok:
                data = r.json()
                return {"llm_report": data.get("report", ""), "llm_source": data.get("source", "mistral")}
        except Exception:
            pass

    # 2. Try direct Mistral AI API with structured evidence
    key = _resolve_key()
    if key and len(key) > 5:
        base = os.getenv('MISTRAL_BASE_URL', 'https://api.mistral.ai/v1').rstrip('/')
        model = os.getenv('MISTRAL_MODEL', 'mistral-small-latest')
        system = (
            "You are SkyGuard AI reporting layer for automated weather station diagnostics. "
            "You must ONLY use the supplied structured telemetry, ML evidence, physics score, SHAP feature attributions, and maintenance recommendations. "
            "Never invent conflicting diagnosis or replace the ML/physics decision logic. "
            "Format the report clearly with the following sections:\n"
            "1. Anomaly Summary\n"
            "2. Root Cause Analysis\n"
            "3. Evidence Explanation (XGBoost, Isolation Forest, Physics, Spatial, Temporal)\n"
            "4. SHAP Feature Attribution Meaning\n"
            "5. Severity & Health Assessment\n"
            "6. Recommended Maintenance Actions"
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
                "score": diagnostic.get("health_score", 100),
                "status": diagnostic.get("health_status", "GOOD"),
                "severity": diagnostic.get("severity", "NONE")
            },
            "maintenance": diagnostic.get("maintenance", {})
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
                return {"llm_report": content, "llm_source": "mistral"}
        except Exception:
            pass

    # 3. Deterministic Local Narrative Fallback
    local_rep = generate_local_narrative(diagnostic)
    return {"llm_report": local_rep, "llm_source": "fallback"}
