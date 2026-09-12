import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const simulationRoutes = Router();

// POST /api/simulation/anomaly -> ADMIN, ENGINEER (simulation:run)
simulationRoutes.post(
    "/anomaly",
    authenticateUser,
    authorize(PERMISSIONS.SIMULATION_RUN),
    authorizeStationAccess("stationId"),
    (req, res) => {
        const { stationId, anomalyType, severity } = req.body;
        const userRole = (req.user?.role || "").toLowerCase();
        const effectiveStationId = userRole === "admin"
            ? (stationId || "AWS_01")
            : (req.user?.stationId || stationId);

        res.status(200).json({
            message: "Anomaly simulation triggered successfully",
            simulation: {
                stationId: effectiveStationId,
                anomalyType: anomalyType || "SENSOR_DRIFT",
                severity: severity || "high",
                triggeredBy: req.user.username,
                timestamp: new Date().toISOString(),
            },
        });
    }
);

export default simulationRoutes;
