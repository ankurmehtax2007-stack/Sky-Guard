import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({
    register
});

export const readingsReceived = new client.Counter({
    name: "weather_readings_received_total",
    help: "Total number of sensor readings received"
});

export const anomaliesDetected = new client.Counter({
    name: "weather_anomalies_detected_total",
    help: "Total number of anomalies detected"
});

export const mlFailures = new client.Counter({
    name: "weather_ml_failures_total",
    help: "Total number of ML processing failures"
});

export const activeWebSocketConnections = new client.Gauge({
    name: "weather_websocket_connections",
    help: "Number of active WebSocket connections"
});

export const mlPredictionDuration = new client.Histogram({
    name: "weather_ml_prediction_duration_seconds",
    help: "Duration of ML predictions in seconds",
    buckets: [0.1, 0.25, 0.5, 1, 2, 5]
});

export const registerMetrics = () => {
    register.registerMetric(readingsReceived);
    register.registerMetric(anomaliesDetected);
    register.registerMetric(mlFailures);
    register.registerMetric(activeWebSocketConnections);
    register.registerMetric(mlPredictionDuration);
};

export default register;