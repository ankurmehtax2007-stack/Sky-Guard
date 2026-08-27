from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Any, Union

class RawTelemetry(BaseModel):
    model_config = {"extra": "allow"}
    station_id: str = Field(default='DEMO-001')
    station_name: Optional[str] = 'Demo Weather Station'
    city: Optional[str] = 'New Delhi'
    cluster: Optional[str] = 'NCR'
    timestamp: Optional[Any] = Field(default_factory=lambda: datetime.now().isoformat() + "Z")
    latitude: Optional[float] = Field(default=28.6139)
    longitude: Optional[float] = Field(default=77.2090)
    temperature_c: float = Field(default=25.0)
    humidity_pct: float = Field(default=50.0)
    pressure_hpa: float = Field(default=1013.25)
    temperature_c_rate_1h: Optional[float] = None
    humidity_pct_rate_1h: Optional[float] = None
    pressure_hpa_rate_1h: Optional[float] = None
    temperature_c_frozen_count: Optional[int] = None
    humidity_pct_frozen_count: Optional[int] = None
    pressure_hpa_frozen_count: Optional[int] = None
    spatial_temp_zscore: Optional[float] = None
    generate_report: Optional[bool] = None
    generate_llm: Optional[bool] = None

    @field_validator('cluster')
    @classmethod
    def clean_cluster(cls, v: Any) -> str:
        if v is None:
            return 'NCR'
        s = str(v).strip()
        return s if s else 'NCR'

Telemetry = RawTelemetry

class AnalyzeRequest(BaseModel):
    model_config = {"extra": "allow"}
    telemetry: Optional[Union[list[RawTelemetry], RawTelemetry, dict[str, Any], list[dict[str, Any]]]] = None
    generate_report: Optional[bool] = None
    generate_llm: Optional[bool] = None

class FeedbackRequest(BaseModel):
    analysis_id: Optional[str] = None
    station_id: Optional[str] = 'DEMO-001'
    operator_decision: Optional[str] = 'confirmed'
    corrected_root_cause: Optional[str] = None
    comment: Optional[str] = ''
    operator_id: Optional[str] = 'operator_001'
    incident_id: Optional[str] = None
    confirmed: Optional[bool] = None
    operator_comment: Optional[str] = None



