from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

app = FastAPI(
    title="SkyGuard ML Service",
    description="Multi-tier meteorological anomaly detection, physical consistency validation, and autonomous maintenance diagnostics.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Route mounting to support both /api/v1/predict and backend's /api/analyze calls
app.include_router(router, prefix="/api/v1")
app.include_router(router, prefix="/api")
app.include_router(router)

@app.get("/")
def root():
    return {
        "service": "SkyGuard ML Service",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "predict_v1": "POST /api/v1/predict",
            "analyze": "POST /api/analyze",
            "health": "GET /api/health",
            "docs": "/docs"
        }
    }
