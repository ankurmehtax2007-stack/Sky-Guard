import { getNotificationsForUser, markAsRead } from "./notification.service.js";
import logger from "../../utils/logger.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications = await getNotificationsForUser(req.user, {
            status: req.query.status,
        });
        return res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications,
            count: notifications.length,
        });
    } catch (error) {
        logger.error({ error }, "Error fetching notifications");
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const updated = await markAsRead(req.params.id, req.user);
        return res.status(200).json({
            message: "Notification marked as read",
            notification: updated,
        });
    } catch (error) {
        logger.error({ error }, "Error marking notification as read");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};
