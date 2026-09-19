# SkyGuard ML Service

Single inference endpoint:

`POST /api/v1/predict`

Request contains raw telemetry records. The service validates, cleans, engineers features, runs Isolation Forest, XGBoost, physics, temporal and spatial evidence, fuses the evidence, determines decision/severity/health, and returns explainability and maintenance recommendations.

Example request:
```json
{"telemetry":[{"station_id":"AWS_001","timestamp":"2026-09-17T10:00:00","temperature_c":34.5,"humidity_pct":72,"pressure_hpa":1008.2,"latitude":25.4358,"longitude":81.8463}]}
```

Run:
`uvicorn app.main:app --host 0.0.0.0 --port 8000`

Only one POST route is exposed. `/` is a simple service-information GET route.
