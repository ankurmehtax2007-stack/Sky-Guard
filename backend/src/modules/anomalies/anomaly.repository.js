import mongoose from "mongoose";
import Anomaly from "./anomaly.model.js";
import logger from "../../utils/logger.js";

export const createAnomaly = async (anomalyData) => {
    try {
        const anomaly = new Anomaly(anomalyData);
        await anomaly.save();
        return anomaly;
    } catch (error) {
        if (error.code !== 11000) {
            logger.error({ err: error }, "Error creating anomaly");
        }
        throw error;
    }
};

export const findAnomalyByReadingId = async (readingId) => {
    try {
        return await Anomaly.findOne({ readingId });
    } catch (error) {
        logger.error({ error, readingId }, "Error finding anomaly by readingId");
        return null;
    }
};

export const findRecentIncident = async (stationId, sensor, secondsAgo = 20) => {
    try {
        const threshold = new Date(Date.now() - secondsAgo * 1000);
        return await Anomaly.findOne({
            stationId,
            sensor,
            status: "pending",
            detectedAt: { $gte: threshold }
        }).sort({ detectedAt: -1 });
    } catch (error) {
        logger.error({ error, stationId, sensor }, "Error finding recent incident");
        return null;
    }
};

const buildAnomalyFilter = (stationId, options = {}) => {
    const filter = stationId
        ? { stationId }
        : {};

    if (options.from || options.to) {
        filter.timestamp = {};

        if (options.from) {
            filter.timestamp.$gte = new Date(options.from);
        }

        if (options.to) {
            filter.timestamp.$lte = new Date(options.to);
        }
    }

    if (options.sensor) {
        filter.sensor = options.sensor;
    }

    if (options.severity) {
        filter.severity = options.severity;
    }

    if (options.status) {
        filter.status = options.status;
    }

    return filter;
};

export const findAnomalies = async (stationId, options = {}) => {
    const filter = buildAnomalyFilter(stationId, options);
    try {
        const anomalies = await Anomaly.find(filter)
            .sort({ detectedAt: -1 })
            .skip(options.skip || 0)
            .limit(options.limit || 50);
        return anomalies;
    } catch (error) {
        logger.error({ error }, "Error fetching anomalies: repository");
        throw error;
    }
};

export const countAnomalies = async (stationId, options = {}) => {
    const filter = buildAnomalyFilter(stationId, options);
    try {
        const count = await Anomaly.countDocuments(filter);
        return count;
    } catch (error) {
        logger.error({ error }, "Error counting anomalies: repository");
        throw error;
    }
};

export const findAnomalyById = async (anomalyId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(anomalyId)) {
            return null;
        }
        const anomaly = await Anomaly.findById(anomalyId).lean();
        return anomaly;
    } catch (error) {
        logger.error({ error }, "Error fetching anomaly by id: repository");
        throw error;
    }
};

export const updateAnomalyStatusRepo = async (anomalyId, status, update = {}) => {
    if (!mongoose.Types.ObjectId.isValid(anomalyId)) {
        return null;
    }

    const updateData = {
        status,
        ...update
    };

    try {
        const updatedAnomaly = await Anomaly.findByIdAndUpdate(
            anomalyId,
            updateData,
            { returnDocument: "after", new: true }
        );
        return updatedAnomaly;
    } catch (error) {
        logger.error({ error }, "Error updating anomaly status: repository");
        throw error;
    }
};