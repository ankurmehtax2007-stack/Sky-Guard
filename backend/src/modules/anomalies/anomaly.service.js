import { broadcast } from "../../websocket/websocket.manager.js";
import { countAnomalies, createAnomaly, findAnomalies, findAnomalyById, updateAnomalyStatusRepo } from "./anomaly.repository.js";

export const saveAnomaly = async (reading, prediction) => {

    const anomalyData = {
        stationId: reading.stationId,
        readingId: reading._id,
        timestamp: reading.timestamp,
        sensor: prediction.sensor,
        value: reading[prediction.sensor],
        anomalyType: prediction.anomalyType,
        severity: prediction.severity,
        confidence: prediction.confidence,
        message: prediction.message,
        action: prediction.action
    };

    const anomaly = await createAnomaly(anomalyData);
    broadcast({
        type: "ANOMALY_DETECTED",
        stationId: reading.stationId,
        anomaly
    });
    return anomaly;
};

export const fetchAnomalies = async (stationId, pageNumber, limitNumber, from, to) => {
    try {
        const skip = (pageNumber - 1) * limitNumber;
        const options = {
            skip,
            limit: limitNumber,
            from,
            to
        };

        const [anomalies, total] = await Promise.all([
            findAnomalies(stationId, options),
            countAnomalies(stationId, options)
        ]);

        return {
            anomalies,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        }
    } catch (error) {
        console.error("Error fetching anomalies: service", error.message);
        throw error;
    }
}

export const fetchAnomalyById = async (anomalyId) => {
    try {
        const anomaly = await findAnomalyById(anomalyId);
        return anomaly;
    } catch (error) {
        console.error("Error fetching anomaly by id: service", error.message);
        throw error;
    }
}

export const updateAnomalyStatus = async (
    anomalyId,
    status,
    resolvedBy = null
) => {

    try {

        const anomaly = await findAnomalyById(anomalyId);

        if (!anomaly) {
            throw new Error("Anomaly not found");
        }

        if (anomaly.status === "resolved") {
            throw new Error("Resolved anomaly cannot be updated");
        }

        const updates = {};

        if (status === "resolved") {

            updates.resolvedAt = new Date();
            updates.resolvedBy = resolvedBy;

        }

        return await updateAnomalyStatusRepo(
            anomalyId,
            status,
            updates
        );

    } catch (error) {

        console.error(
            "Error updating anomaly status: service",
            error.message
        );

        throw error;
    }
};
