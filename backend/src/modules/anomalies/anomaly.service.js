import { broadcast } from "../../websocket/websocket.manager.js";
import { countAnomalies, createAnomaly, findAnomalies, findAnomalyById, updateAnomalyStatusRepo } from "./anomaly.repository.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";

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

    try {

        const anomaly = await createAnomaly(anomalyData);

        try {

            broadcast({
                type: "ANOMALY_DETECTED",
                stationId: reading.stationId,
                anomaly
            });

        } catch (error) {

            logger.error({ err: error }, "Error broadcasting anomaly: service");
        }

        return anomaly;

    } catch (error) {

        if (error.code === 11000) {

            logger.info(
                { readingId: reading._id },
                "Anomaly already exists for reading"
            );

            return null;
        }

        logger.error({ err: error, readingId: reading._id }, "Error saving anomaly: service");

        throw error;
    }
};
export const fetchAnomalies = asyncHandler(async (stationId, pageNumber, limitNumber, from, to) => {
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
})

export const fetchAnomalyById = asyncHandler(async (anomalyId) => {
    const anomaly = await findAnomalyById(anomalyId);
    return anomaly;
})

export const updateAnomalyStatus = asyncHandler(async (anomalyId,status,resolvedBy = null) => {
    const anomaly = await findAnomalyById(anomalyId);

    if (!anomaly) {
        throw new AppError("Anomaly not found", 404);
    }

    if (anomaly.status === "resolved") {
        throw new AppError("Resolved anomaly cannot be updated", 400);
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
});
