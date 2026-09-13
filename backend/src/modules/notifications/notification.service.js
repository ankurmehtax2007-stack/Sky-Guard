import {
    createNotification,
    findNotificationsForAdmin,
    findNotificationsForUser,
    markNotificationRead,
    findNotificationById,
} from "./notification.repository.js";
import logger from "../../utils/logger.js";

export const createRegistrationNotification = async ({ userId, username, role, stationId }) => {
    try {
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        await createNotification({
            recipientRole: "admin",
            type: "USER_REGISTRATION",
            message: `New ${roleLabel} registration request from ${username}`,
            relatedUserId: userId,
            stationId: stationId || null,
            status: "UNREAD",
        });
    } catch (error) {
        logger.error({ error }, "Failed to create registration notification");
    }
};

export const createUserNotification = async ({ recipientId, type, message, stationId }) => {
    try {
        await createNotification({
            recipientId,
            type,
            message,
            stationId: stationId || null,
            status: "UNREAD",
        });
    } catch (error) {
        logger.error({ error }, "Failed to create user notification");
    }
};

export const getNotificationsForUser = async (user, { status } = {}) => {
    const role = (user.role || "").toLowerCase();
    if (role === "admin") {
        return await findNotificationsForAdmin(status || null);
    }
    return await findNotificationsForUser(user._id || user.id, status || null);
};

export const markAsRead = async (notificationId, user) => {
    const notification = await findNotificationById(notificationId);
    if (!notification) {
        const err = new Error("Notification not found");
        err.status = 404;
        throw err;
    }
    const role = (user.role || "").toLowerCase();
    if (
        role !== "admin" &&
        String(notification.recipientId) !== String(user._id || user.id)
    ) {
        const err = new Error("Forbidden: cannot mark another user's notification");
        err.status = 403;
        throw err;
    }
    return await markNotificationRead(notificationId);
};
