from pydantic import BaseModel, ConfigDict
from typing import Any, List, Dict, Optional

class PredictResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    status: str = "success"
    results: List[Dict[str, Any]]
    analysis: Optional[Dict[str, Any]] = None

class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    status: Optional[str] = "success"
    analysis: Dict[str, Any]
    results: Optional[List[Dict[str, Any]]] = None

class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    status: str
    models_loaded: bool
    features_count: int
    classes_count: int
    mistral_configured: bool = False

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    status: str = "success"
    message: str = "Feedback registered successfully"
    reading_id: Optional[str] = None

class ReportResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    status: str = "success"
    report: str
    llm_report: str
    ai_recommendations: List[str]
    recommendations: List[str]
    source: str = "deterministic_rules"
