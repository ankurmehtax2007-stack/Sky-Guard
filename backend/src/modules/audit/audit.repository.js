import mongoose from "mongoose";
import { AuditLog } from "./audit.model.js";
import logger from "../../utils/logger.js";

export const createAuditLog = async (data) => {
    if (mongoose.connection.readyState !== 1) {
        logger.warn({ data }, "DB unavailable: audit log not persisted");
        return null;
    }
    try {
        return await AuditLog.create(data);
    } catch (error) {
        logger.error({ error }, "Error writing audit log");
        return null;
    }
};

export const findAuditLogs = async (filters = {}) => {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.actorId) query.actor = filters.actorId;
    if (filters.stationId) query.stationId = filters.stationId;
    if (filters.from || filters.to) {
        query.createdAt = {};
        if (filters.from) query.createdAt.$gte = new Date(filters.from);
        if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }

    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AuditLog.countDocuments(query),
    ]);

    return { logs, total, page, limit };
};
