import config from "../../config/config.js";
import logger from "../../utils/logger.js";

export const predictReading = async (reading) => {
    try {
        const response = await fetch(`${config.mlServiceURL}/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                temperature_c: reading.temperature,
                humidity_pct: reading.humidity,
                pressure_hpa: reading.pressure
            })
        });

        if (!response.ok) {
            throw new Error(`ML service returned ${response.status}`);
        }

        const result = await response.json();
        const analysis = result.analysis;

        const rootCause = analysis.anomaly.root_cause;
        const faultType = (rootCause && rootCause !== "normal" && rootCause !== "known_anomaly")
            ? rootCause
            : (analysis.anomaly.decision && analysis.anomaly.decision !== "normal" && analysis.anomaly.decision !== "known_anomaly"
                ? analysis.anomaly.decision
                : "sensor_anomaly");

        return {
            isAnomaly: analysis.anomaly.detected,
            sensor: analysis.anomaly.root_cause,
            anomalyType: faultType,
            severity: analysis.anomaly.severity.toLowerCase(),
            confidence: analysis.anomaly.confidence,
            message: `ML detected ${rootCause || analysis.anomaly.decision}`,
            action: analysis.maintenance.recommended_action,
            analysis
        };
    } catch (error) {
        logger.error({ error }, "Error communicating with ML service");
        throw error;
    }
};