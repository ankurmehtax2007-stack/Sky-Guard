import mongoose from "mongoose";
import { Notification } from "./notification.model.js";
import logger from "../../utils/logger.js";

export const createNotification = async (data) => {
    if (mongoose.connection.readyState !== 1) {
        logger.warn({ data }, "DB unavailable: notification not persisted");
        return null;
    }
    try {
        return await Notification.create(data);
    } catch (error) {
        logger.error({ error }, "Error creating notification");
        return null;
    }
};

export const findNotificationsForAdmin = async (status = null) => {
    if (mongoose.connection.readyState !== 1) return [];
    const query = { recipientRole: "admin" };
    if (status) query.status = status.toUpperCase();
    return await Notification.find(query)
        .sort({ createdAt: -1 })
        .populate("relatedUserId", "username email role stationId")
        .lean();
};

export const findNotificationsForUser = async (userId, status = null) => {
    if (mongoose.connection.readyState !== 1) return [];
    const query = { recipientId: userId };
    if (status) query.status = status.toUpperCase();
    return await Notification.find(query)
        .sort({ createdAt: -1 })
        .lean();
};

export const markNotificationRead = async (notificationId) => {
    if (mongoose.connection.readyState !== 1) return null;
    return await Notification.findByIdAndUpdate(
        notificationId,
        { status: "READ" },
        { new: true }
    );
};

export const findNotificationById = async (id) => {
    if (mongoose.connection.readyState !== 1) return null;
    return await Notification.findById(id);
};
