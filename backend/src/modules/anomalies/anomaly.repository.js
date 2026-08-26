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

const buildAnomalyFilter = (stationId, options) => {
    const filter = stationId
        ? { stationId }
        : {};

    if (options.from || options.to) {
        filter.timestamp = {};

        if (options.from) {
            filter.timestamp.$gte = options.from;
        }

        if (options.to) {
            filter.timestamp.$lte = options.to;
        }
    }

    return filter;
};

export const findAnomalies = async (stationId, options) => {
    const filter = buildAnomalyFilter(stationId, options);
    try {
        const anomalies = await Anomaly.find(filter)
            .sort({ detectedAt: -1 })
            .skip(options.skip)
            .limit(options.limit);
        return anomalies;
    } catch (error) {
        logger.error({ error }, "Error fetching anomalies: repository");
        throw error;
    }
}

export const countAnomalies = async (stationId , options) => {
    const filter = buildAnomalyFilter(stationId , options);
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
        const anomaly = await Anomaly.findById(anomalyId).lean();
        return anomaly;
    } catch (error) {
        logger.error({ error }, "Error fetching anomaly by id: repository");
        throw error;
    }
};

export const updateAnomalyStatusRepo = async (anomalyId , status , update = {}) => {
    const updateData = {
        status,
        ...update
    };

    try {
        const updatedAnomaly = await Anomaly.findByIdAndUpdate(
            anomalyId,
            updateData,
            { returnDocument: "after" }
        );
        return updatedAnomaly;
    } catch (error) {
        logger.error({ error }, "Error updating anomaly status: repository");
        throw error;
    }
};