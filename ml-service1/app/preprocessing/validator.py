from datetime import datetime
from typing import Optional, List, Union, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class TelemetryInput(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    station_id: Optional[str] = "AWS_001"
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    temperature_c: float = Field(25.0, ge=-100.0, le=150.0)
    humidity_pct: float = Field(50.0, ge=-20.0, le=150.0)
    pressure_hpa: float = Field(1013.25, ge=400.0, le=1300.0)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    station_name: Optional[str] = None
    city: Optional[str] = None
    cluster: Optional[str] = "NCR"

class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    telemetry: Union[List[TelemetryInput], TelemetryInput, List[Dict[str, Any]], Dict[str, Any]]
    include_explanation: bool = True
    include_maintenance: bool = True
    generate_report: bool = False

class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    telemetry: Optional[Union[List[TelemetryInput], TelemetryInput, List[Dict[str, Any]], Dict[str, Any]]] = None
    generate_report: Optional[bool] = None
    generate_llm: Optional[bool] = None

class FeedbackRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    reading_id: Optional[str] = None
    station_id: Optional[str] = None
    verified_label: Optional[str] = None
    technician_notes: Optional[str] = None
    is_anomaly: Optional[bool] = None

def extract_telemetry_records(data: Any) -> List[Dict[str, Any]]:
    """
    Safely unpacks telemetry payloads whether passed as Pydantic models,
    lists of readings, single reading dictionaries, or nested telemetry keys.
    """
    if data is None:
        return [{"station_id": "AWS_001", "temperature_c": 25.0, "humidity_pct": 50.0, "pressure_hpa": 1013.25}]

    if isinstance(data, (PredictRequest, AnalyzeRequest)):
        target = data.telemetry
        if target is None:
            # Fallback if telemetry was passed at root of extra fields
            dump = data.model_dump()
            if "temperature_c" in dump or "temperature" in dump:
                target = dump
            else:
                return [{"station_id": "AWS_001", "temperature_c": 25.0, "humidity_pct": 50.0, "pressure_hpa": 1013.25}]
    elif isinstance(data, TelemetryInput):
        return [data.model_dump()]
    elif isinstance(data, dict):
        if "telemetry" in data and data["telemetry"] is not None:
            target = data["telemetry"]
        else:
            target = data
    else:
        target = data

    out: List[Dict[str, Any]] = []
    if isinstance(target, list):
        for item in target:
            if hasattr(item, "model_dump"):
                out.append(item.model_dump())
            elif isinstance(item, dict):
                out.append(item)
    elif hasattr(target, "model_dump"):
        out.append(target.model_dump())
    elif isinstance(target, dict):
        # Normalize alternative keys (e.g., temperature -> temperature_c)
        normalized = dict(target)
        if "temperature" in normalized and "temperature_c" not in normalized:
            normalized["temperature_c"] = normalized.pop("temperature")
        if "humidity" in normalized and "humidity_pct" not in normalized:
            normalized["humidity_pct"] = normalized.pop("humidity")
        if "pressure" in normalized and "pressure_hpa" not in normalized:
            normalized["pressure_hpa"] = normalized.pop("pressure")
        out.append(normalized)

    if not out:
        out = [{"station_id": "AWS_001", "temperature_c": 25.0, "humidity_pct": 50.0, "pressure_hpa": 1013.25}]

    # Ensure timestamp is present in each record
    for r in out:
        if "timestamp" not in r or r["timestamp"] is None:
            r["timestamp"] = datetime.utcnow()
        if "station_id" not in r or not r["station_id"]:
            r["station_id"] = "AWS_001"

    return out
