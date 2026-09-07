import { broadcast } from "../../websocket/websocket.manager.js";
import { countAnomalies, createAnomaly, findAnomalies, findAnomalyById, updateAnomalyStatusRepo, findAnomalyByReadingId, findRecentIncident } from "./anomaly.repository.js";
import logger from "../../utils/logger.js";
import AppError from "../../utils/appError.js";

export const saveAnomaly = async (reading, prediction) => {
    // Map composite root_cause to valid enum: ["temperature", "humidity", "pressure"]
    let sensor = "temperature";
    const rawSensor = String(prediction.sensor || "").toLowerCase();
    if (rawSensor.includes("hum")) {
        sensor = "humidity";
    } else if (rawSensor.includes("press")) {
        sensor = "pressure";
    } else if (rawSensor.includes("temp")) {
        sensor = "temperature";
    } else if (prediction.analysis?.explanation?.shap_factors?.length) {
        const top = String(prediction.analysis.explanation.shap_factors[0].feature || "").toLowerCase();
        if (top.includes("hum")) sensor = "humidity";
        else if (top.includes("press")) sensor = "pressure";
        else sensor = "temperature";
    }

    const sensorVal = reading[sensor] !== undefined ? reading[sensor] : (reading.value ?? 0);

    const validSeverities = ["low", "medium", "high", "critical"];
    const rawSeverity = String(prediction.severity || "high").toLowerCase();
    const severity = validSeverities.includes(rawSeverity) ? rawSeverity : "high";

    let resolvedAnomalyType = prediction.anomalyType || prediction.sensor || "sensor_anomaly";
    if (
        resolvedAnomalyType === "known_anomaly" ||
        resolvedAnomalyType === "know_anomaly" ||
        resolvedAnomalyType === "temp" ||
        resolvedAnomalyType === "temperature" ||
        resolvedAnomalyType === "humidity" ||
        resolvedAnomalyType === "pressure"
    ) {
        if (sensor === "temperature") {
            resolvedAnomalyType = sensorVal > 45 ? "temperature_spike" : sensorVal < 5 ? "cryogenic_dip" : "thermal_outlier";
        } else if (sensor === "humidity") {
            resolvedAnomalyType = sensorVal > 85 ? "humidity_spike" : sensorVal < 15 ? "arid_drop" : "humidity_outlier";
        } else if (sensor === "pressure") {
            resolvedAnomalyType = sensorVal > 1040 ? "pressure_jump" : sensorVal < 970 ? "barometric_drop" : "pressure_outlier";
        } else {
            resolvedAnomalyType = "sensor_anomaly";
        }
    }

    // 1. Reading-level deduplication: If an anomaly already exists for this reading, return it
    if (reading._id) {
        const existing = await findAnomalyByReadingId(reading._id);
        if (existing) {
            logger.info({ readingId: reading._id }, "Duplicate reading anomaly ignored");
            return existing;
        }
    }

    // 2. Incident-level deduplication: If this station & sensor already triggered an
    // active anomaly incident within the last 20 seconds, suppress duplicates
    const recentIncident = await findRecentIncident(reading.stationId, sensor, 20);
    if (recentIncident) {
        logger.info(
            { stationId: reading.stationId, sensor, existingId: recentIncident._id },
            "Suppressed duplicate anomaly burst: incident already active"
        );
        return recentIncident;
    }

    const anomalyData = {
        stationId: reading.stationId,
        readingId: reading._id,
        timestamp: reading.timestamp || new Date(),
        sensor,
        value: typeof sensorVal === "number" ? sensorVal : 0,
        anomalyType: resolvedAnomalyType,
        severity,
        confidence: typeof prediction.confidence === "number" ? Math.min(Math.max(prediction.confidence, 0), 1) : 0.9,
        message: prediction.message || `ML detected ${sensor} anomaly`,
        action: prediction.action || "Inspect sensor calibration"
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
export const fetchAnomalies = async (stationId, pageNumber = 1, limitNumber = 50, from, to, filters = {}) => {
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const limit = Number(limitNumber) > 0 ? Number(limitNumber) : 50;
    const skip = (page - 1) * limit;
    const options = {
        skip,
        limit,
        from,
        to,
        ...filters
    };

    const [anomalies, total] = await Promise.all([
        findAnomalies(stationId, options),
        countAnomalies(stationId, options)
    ]);

    return {
        anomalies,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const fetchAnomalyById = async (anomalyId) => {
    const anomaly = await findAnomalyById(anomalyId);
    if (!anomaly) {
        throw new AppError("Anomaly not found", 404);
    }
    return anomaly;
};

export const updateAnomalyStatus = async (anomalyId, status, resolvedBy = null) => {
    const anomaly = await findAnomalyById(anomalyId);

    if (!anomaly) {
        throw new AppError("Anomaly not found", 404);
    }

    if (anomaly.status === "resolved" && status === "resolved") {
        throw new AppError("Resolved anomaly cannot be updated", 400);
    }

    const updates = {};

    if (status === "resolved") {
        updates.resolvedAt = new Date();
        updates.resolvedBy = resolvedBy || "Operator";
    }

    const updated = await updateAnomalyStatusRepo(
        anomalyId,
        status,
        updates
    );

    if (updated) {
        try {
            broadcast({
                type: "ANOMALY_STATUS_UPDATED",
                stationId: updated.stationId,
                anomaly: updated
            });
        } catch (error) {
            logger.error({ err: error }, "Error broadcasting anomaly update: service");
        }
    }

    return updated;
};
