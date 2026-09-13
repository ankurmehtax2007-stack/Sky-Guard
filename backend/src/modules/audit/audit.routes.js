import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";
import { getAuditLogs } from "./audit.service.js";
import logger from "../../utils/logger.js";

const auditRoutes = Router();

auditRoutes.get(
    "/",
    authenticateUser,
    authorize(PERMISSIONS.AUDIT_READ),
    async (req, res) => {
        try {
            const { action, actorId, stationId, from, to, page, limit } = req.query;
            const result = await getAuditLogs({ action, actorId, stationId, from, to, page, limit });
            return res.status(200).json({
                message: "Audit logs retrieved successfully",
                ...result,
            });
        } catch (error) {
            logger.error({ error }, "Error retrieving audit logs");
            return res.status(500).json({ message: "Internal server error" });
        }
    }
);

export default auditRoutes;
