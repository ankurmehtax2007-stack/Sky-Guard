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
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
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
    if (mongoose.connection.readyState !== 1) {
        return 0;
    }
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
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    try {
        if (!mongoose.Types.ObjectId.isValid(anomalyId)) {
            return null;
        }
        const anomaly = await Anomaly.findById(anomalyId).lean();
        if (anomaly && !anomaly.assignedToName) {
            try {
                const { Task } = await import("../tasks/task.model.js");
                const task = await Task.findOne({
                    $or: [
                        { anomalyId: anomaly._id },
                        { description: { $regex: anomaly._id.toString() } }
                    ]
                }).populate("assignedTo", "username").lean();
                if (task && task.assignedTo) {
                    anomaly.assignedTo = task.assignedTo._id || task.assignedTo;
                    anomaly.assignedToName = task.assignedTo.username || "Engineer";
                    anomaly.assignedTaskId = task._id;
                }
            } catch (err) {
                // Non-fatal fallback
            }
        }
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

export const getAnomalyStatsRepo = async (stationId, options = {}) => {
    if (mongoose.connection.readyState !== 1) {
        return { total: 0, pending: 0, acknowledged: 0, resolved: 0, active: 0, critical: 0 };
    }

    const baseFilter = {};
    if (stationId) {
        if (Array.isArray(stationId)) {
            baseFilter.stationId = { $in: stationId };
        } else if (typeof stationId === "string" && stationId.includes(",")) {
            baseFilter.stationId = { $in: stationId.split(",").map((s) => s.trim()) };
        } else {
            baseFilter.stationId = stationId;
        }
    }

    try {
        const [total, pending, acknowledged, resolved, criticalPending] = await Promise.all([
            Anomaly.countDocuments(baseFilter),
            Anomaly.countDocuments({ ...baseFilter, status: "pending" }),
            Anomaly.countDocuments({ ...baseFilter, status: "acknowledged" }),
            Anomaly.countDocuments({ ...baseFilter, status: "resolved" }),
            Anomaly.countDocuments({ ...baseFilter, status: "pending", severity: "critical" }),
        ]);

        return {
            total,
            pending,
            acknowledged,
            resolved,
            active: pending + acknowledged,
            critical: criticalPending,
        };
    } catch (error) {
        logger.error({ error, stationId }, "Error getting anomaly stats: repository");
        throw error;
    }
};