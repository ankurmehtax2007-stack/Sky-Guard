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

        return {
            isAnomaly: analysis.anomaly.detected,
            sensor: analysis.anomaly.root_cause,
            anomalyType: analysis.anomaly.decision,
            severity: analysis.anomaly.severity.toLowerCase(),
            confidence: analysis.anomaly.confidence,
            message: `ML detected ${analysis.anomaly.root_cause}`,
            action: analysis.maintenance.recommended_action,
            analysis
        };
    } catch (error) {
        logger.error({ error }, "Error communicating with ML service");
        throw error;
    }
};