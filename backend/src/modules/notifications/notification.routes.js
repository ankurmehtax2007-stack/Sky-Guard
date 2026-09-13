import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";
import { getNotifications, markNotificationRead } from "./notification.controller.js";

const notificationRoutes = Router();

notificationRoutes.get(
    "/",
    authenticateUser,
    authorize(PERMISSIONS.NOTIFICATION_READ),
    getNotifications
);

notificationRoutes.patch(
    "/:id/read",
    authenticateUser,
    authorize(PERMISSIONS.NOTIFICATION_READ),
    markNotificationRead
);

export default notificationRoutes;
