import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const alertRoutes = Router();

alertRoutes.post(
    "/:id/acknowledge",
    authenticateUser,
    authorize(PERMISSIONS.ALERTS_ACKNOWLEDGE),
    authorizeStationAccess(),
    (req, res) => {
        const { id } = req.params;
        const { note } = req.body;

        res.status(200).json({
            message: `Alert ${id} acknowledged successfully`,
            alertId: id,
            status: "acknowledged",
            acknowledgedBy: req.user.username,
            note: note || null,
            timestamp: new Date().toISOString(),
        });
    }
);

alertRoutes.post(
    "/:id/resolve",
    authenticateUser,
    authorize(PERMISSIONS.ALERTS_RESOLVE),
    authorizeStationAccess(),
    (req, res) => {
        const { id } = req.params;
        const { resolutionNotes } = req.body;

        res.status(200).json({
            message: `Alert ${id} resolved successfully`,
            alertId: id,
            status: "resolved",
            resolvedBy: req.user.username,
            resolutionNotes: resolutionNotes || "Resolved by operator/engineer",
            timestamp: new Date().toISOString(),
        });
    }
);

export default alertRoutes;
