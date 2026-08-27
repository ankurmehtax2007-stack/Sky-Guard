from fastapi import APIRouter, HTTPException, Request
from typing import Any, Union
from .schemas import (
    AnalyzeResponse,
    FeedbackResponse,
    format_analysis_response,
    format_feedback_response
)
from ..preprocessing.validator import RawTelemetry, AnalyzeRequest, FeedbackRequest
from ..core.model_loader import load_artifacts
from ..pipeline.inference import run_pipeline
from ..explainability.llm_report import _resolve_key, generate_ai_report

router = APIRouter()

def _extract_records(data: Any) -> list[dict]:
    if isinstance(data, RawTelemetry):
        return [data.model_dump()]
    elif isinstance(data, AnalyzeRequest):
        t = data.telemetry
        if t is None:
            return [{'temperature_c': 25.0, 'humidity_pct': 50.0, 'pressure_hpa': 1013.25}]
    elif isinstance(data, dict):
        if 'telemetry' in data:
            t = data['telemetry']
        else:
            return [data]
    else:
        t = data

    if isinstance(t, list):
        out = []
        for x in t:
            if hasattr(x, 'model_dump'):
                out.append(x.model_dump())
            elif isinstance(x, dict):
                out.append(x)
        return out if out else [{'temperature_c': 25.0, 'humidity_pct': 50.0, 'pressure_hpa': 1013.25}]
    elif hasattr(t, 'model_dump'):
        return [t.model_dump()]
    elif isinstance(t, dict):
        return [t]
    return [{'temperature_c': 25.0, 'humidity_pct': 50.0, 'pressure_hpa': 1013.25}]

@router.get('/health')
def health():
    try:
        iso, xgb, meta = load_artifacts()
        key = _resolve_key()
        return {
            'status': 'ok',
            'models_loaded': True,
            'mistral_configured': bool(key and len(key) > 5),
            'features_count': len(meta.get('feature_cols', [])),
            'classes_count': len(meta.get('classes', []))
        }
    except Exception as e:
        return {'status': 'degraded', 'models_loaded': False, 'error': str(e)}

@router.post('/analyze', response_model=AnalyzeResponse)
def analyze(req: Union[RawTelemetry, AnalyzeRequest, dict[str, Any]]):
    try:
        iso, xgb, meta = load_artifacts()
        records = _extract_records(req)

        # Extract request-level generate_report flag if present
        generate_report = None
        if hasattr(req, 'generate_report') and req.generate_report is not None:
            generate_report = req.generate_report
        elif hasattr(req, 'generate_llm') and req.generate_llm is not None:
            generate_report = req.generate_llm
        elif isinstance(req, dict):
            generate_report = req.get('generate_report', req.get('generate_llm'))

        results = run_pipeline(records, iso, xgb, meta, generate_llm=generate_report)
        if not results:
            raise HTTPException(status_code=400, detail='No valid telemetry records could be processed')
        return format_analysis_response(results[-1])
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"ML Pipeline processing error: {str(e)}")

@router.post('/feedback', response_model=FeedbackResponse)
def feedback(req: Union[FeedbackRequest, dict[str, Any]]):
    return format_feedback_response(req)

@router.post('/generate-report')
def generate_report_endpoint(req: dict[str, Any]):
    diagnostic = req.get('diagnostic') or req
    instruction = req.get('instruction', 'Explain the incident and recommend safe maintenance actions.')
    
    # Force report generation on-demand for this anomaly
    ai_rep = generate_ai_report(diagnostic, instruction=instruction, generate_report=True, only_on_anomaly=True)
    return {
        'status': 'success',
        'report': ai_rep.get('llm_report', ''),
        'llm_report': ai_rep.get('llm_report', ''),
        'source': ai_rep.get('llm_source', 'mistral'),
        'provider': ai_rep.get('llm_source', 'mistral')
    }
