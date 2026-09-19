from fastapi import APIRouter, HTTPException, Request
from typing import Any, Union, Dict

from .schemas import (
    PredictResponse,
    AnalyzeResponse,
    HealthResponse,
    FeedbackResponse,
    ReportResponse
)
from ..preprocessing.validator import (
    PredictRequest,
    AnalyzeRequest,
    FeedbackRequest,
    extract_telemetry_records
)
from ..core.model_loader import load_artifacts
from ..core.logger import logger
from ..pipeline.inference import run_pipeline
from ..explainability.shap_explainer import _resolve_key, generate_ai_report

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health():
    try:
        iso, xgb, meta = load_artifacts()
        key = _resolve_key()
        return {
            "status": "ok",
            "models_loaded": bool(iso is not None and xgb is not None),
            "features_count": len(meta.get("feature_cols", [])),
            "classes_count": len(meta.get("classes", [])),
            "mistral_configured": bool(key and len(key) > 5)
        }
    except Exception as e:
        logger.error(f"Health check degraded: {e}")
        return {
            "status": "degraded",
            "models_loaded": False,
            "features_count": 0,
            "classes_count": 0,
            "mistral_configured": False
        }

@router.post("/predict", response_model=PredictResponse)
def predict(req: Union[PredictRequest, Dict[str, Any]]):
    try:
        iso, xgb, meta = load_artifacts()
        records = extract_telemetry_records(req)
        
        include_explanation = getattr(req, "include_explanation", True) if hasattr(req, "include_explanation") else (req.get("include_explanation", True) if isinstance(req, dict) else True)
        include_maintenance = getattr(req, "include_maintenance", True) if hasattr(req, "include_maintenance") else (req.get("include_maintenance", True) if isinstance(req, dict) else True)
        generate_report = getattr(req, "generate_report", False) if hasattr(req, "generate_report") else (req.get("generate_report", False) if isinstance(req, dict) else False)
        
        results = run_pipeline(
            records=records,
            iso_model=iso,
            xgb_model=xgb,
            metadata=meta,
            include_explanation=include_explanation,
            include_maintenance=include_maintenance,
            generate_report=generate_report
        )
        
        latest_analysis = results[-1].get("analysis") if results else None
        return {
            "status": "success",
            "results": results,
            "analysis": latest_analysis
        }
    except Exception as e:
        logger.error(f"Predict endpoint error: {e}")
        raise HTTPException(status_code=422, detail=f"ML Pipeline processing error: {str(e)}")

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: Union[AnalyzeRequest, PredictRequest, Dict[str, Any]]):
    """
    Primary real-time endpoint called by SkyGuard backend (predictReading).
    Accepts raw reading telemetry and returns the analysis structure.
    """
    try:
        iso, xgb, meta = load_artifacts()
        records = extract_telemetry_records(req)
        
        generate_report = None
        if hasattr(req, "generate_report") and req.generate_report is not None:
            generate_report = req.generate_report
        elif hasattr(req, "generate_llm") and req.generate_llm is not None:
            generate_report = req.generate_llm
        elif isinstance(req, dict):
            generate_report = req.get("generate_report", req.get("generate_llm"))
            
        results = run_pipeline(
            records=records,
            iso_model=iso,
            xgb_model=xgb,
            metadata=meta,
            include_explanation=True,
            include_maintenance=True,
            generate_report=bool(generate_report)
        )
        
        if not results:
            raise HTTPException(status_code=400, detail="No telemetry records could be processed")
            
        latest = results[-1]
        analysis_payload = latest.get("analysis", {})
        
        return {
            "status": "success",
            "analysis": analysis_payload,
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Analyze endpoint error: {e}")
        raise HTTPException(status_code=422, detail=f"ML Pipeline processing error: {str(e)}")

@router.post("/feedback", response_model=FeedbackResponse)
def feedback(req: Union[FeedbackRequest, Dict[str, Any]]):
    reading_id = getattr(req, "reading_id", None) if hasattr(req, "reading_id") else (req.get("reading_id") if isinstance(req, dict) else None)
    logger.info(f"Received feedback for reading {reading_id}")
    return {
        "status": "success",
        "message": "Feedback registered successfully",
        "reading_id": reading_id
    }

@router.post("/generate-report", response_model=ReportResponse)
def generate_report_endpoint(req: Dict[str, Any]):
    diagnostic = req.get("diagnostic") or req
    instruction = req.get("instruction", "Explain the incident and recommend maintenance actions.")
    ai_rep = generate_ai_report(diagnostic, instruction=instruction, generate_report=True, only_on_anomaly=False)
    report_text = ai_rep.get("llm_report", "")
    recs = ai_rep.get("ai_recommendations", [])
    source = ai_rep.get("llm_source", "deterministic_rules")
    return {
        "status": "success",
        "report": report_text,
        "llm_report": report_text,
        "ai_recommendations": recs,
        "recommendations": recs,
        "source": source
    }
