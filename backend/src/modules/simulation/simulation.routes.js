import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const simulationRoutes = Router();

// POST /api/simulation/anomaly -> ADMIN, ENGINEER (simulation:run)
simulationRoutes.post("/anomaly", authenticateUser, authorize(PERMISSIONS.SIMULATION_RUN), (req, res) => {
    const { stationId, anomalyType, severity } = req.body;

    res.status(200).json({
        message: "Anomaly simulation triggered successfully",
        simulation: {
            stationId: stationId || "STATION_SIM_01",
            anomalyType: anomalyType || "SENSOR_DRIFT",
            severity: severity || "high",
            triggeredBy: req.user.username,
            timestamp: new Date().toISOString(),
        },
    });
});

export default simulationRoutes;
