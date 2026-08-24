from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Reading(BaseModel):
    stationId: str
    timestamp: str
    temperature: float
    humidity: float
    pressure: float


@app.post("/predict")
def predict(reading: Reading):

    if reading.temperature > 35:
        return {
            "isAnomaly": True,
            "sensor": "temperature",
            "anomalyType": "temperature_spike",
            "severity": "high",
            "confidence": 0.94,
            "message": "Temperature is unusually high",
            "action": "Inspect temperature sensor"
        }

    return {
        "isAnomaly": False,
        "sensor": None,
        "anomalyType": None,
        "severity": None,
        "confidence": 0.08,
        "message": None,
        "action": None
    }