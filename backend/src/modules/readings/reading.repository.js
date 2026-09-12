import mongoose from "mongoose";
import { SensorReading } from "./reading.model.js";
import logger from "../../utils/logger.js";

export const saveReading = async (reading) => {
    try {
        const sensorReading = new SensorReading(reading);
        await sensorReading.save();
        return sensorReading;
    } catch (error) {
        logger.error({ error }, "Error saving reading");
        throw error;
    }
};

export const findLatestReadings = async (stationId = null) => {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    try {
        const pipeline = [];
        if (stationId) {
            pipeline.push({
                $match: { stationId: String(stationId).trim() }
            });
        }
        pipeline.push(
            {
                $sort: {
                    timestamp: -1
                }
            },
            {
                $group: {
                    _id: "$stationId",
                    latestReading: {
                        $first: "$$ROOT"
                    }
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$latestReading"
                }
            }
        );
        const readings = await SensorReading.aggregate(pipeline);
        return readings;
    } catch (error) {
        logger.error({ error }, "Error fetching latest readings");
        throw error;
    }
};

export const findReadingById = async (id) => {
    try {
        const reading = await SensorReading.findById(id);
        return reading;
    } catch (error) {
        logger.error({ error }, "Error fetching reading by id: repository");
        throw error;
    }
};

const buildReadingFilter = (stationId, options) => {
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

export const findReadingsByStation = async (stationId, options) => {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    try {
        const filter = buildReadingFilter(stationId, options);
        const readings = await SensorReading.find(filter)
            .sort({
                timestamp: -1
            }).skip(options.skip).limit(options.limit);
        return readings;
    } catch (error) {
        logger.error({ error }, "Error fetching readings by station: repository");
        throw error;
    }
};

export const countReadingsByStation = async (stationId , options) => {
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
    try {
        const query = buildReadingFilter(stationId , options);

        const count = await SensorReading.countDocuments(query);
        return count;
    } catch (error) {
        logger.error({ error }, "Error counting readings: repository");
        throw error;
    }
}

export const findPendingReadings = async () => {
    try {
        const readings = await SensorReading.find({ mlStatus: "pending" }).limit(100);
        return readings;
    } catch (error) {
        logger.error({ error }, "Error finding pending readings: repository");
        throw error;
    }
}

export const findDetectedAnomalies = async () => {
    try {
        const readings = await SensorReading.find({ anomalyStatus: "detected" }).limit(100);
        return readings;
    } catch (error) {
        logger.error({ error }, "Error finding detected anomalies: repository");
        throw error;
    }
}

export const countTotalReadings = async (stationIds = null) => {
    try {
        const query = stationIds && Array.isArray(stationIds) ? { stationId: { $in: stationIds } } : {};
        const count = await SensorReading.countDocuments(query);
        return count;
    } catch (error) {
        logger.error({ error }, "Error counting total readings: repository");
        throw error;
    }
};

export const updateReading = async (id, updates) => {
    try {
        const reading = await SensorReading.findByIdAndUpdate(id, updates, { returnDocument: "after" });
        return reading;
    } catch (error) {
        logger.error({ error }, "Error updating reading: repository");
        throw error;
    }
}