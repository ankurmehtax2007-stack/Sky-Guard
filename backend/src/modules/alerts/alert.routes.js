import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const alertRoutes = Router();

// POST /api/alerts/:id/acknowledge -> ADMIN, ENGINEER, OPERATOR (alerts:acknowledge)
alertRoutes.post("/:id/acknowledge", authenticateUser, authorize(PERMISSIONS.ALERTS_ACKNOWLEDGE), (req, res) => {
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
});

// POST /api/alerts/:id/resolve -> ADMIN, ENGINEER, OPERATOR (alerts:resolve)
alertRoutes.post("/:id/resolve", authenticateUser, authorize(PERMISSIONS.ALERTS_RESOLVE), (req, res) => {
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
});

export default alertRoutes;
