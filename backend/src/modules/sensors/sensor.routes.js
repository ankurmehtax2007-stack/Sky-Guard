import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const sensorRoutes = Router();

// PATCH /api/sensors/:id/threshold -> ADMIN, ENGINEER (sensors:configure)
sensorRoutes.patch(
    "/:id/threshold",
    authenticateUser,
    authorize(PERMISSIONS.SENSORS_CONFIGURE),
    authorizeStationAccess(),
    (req, res) => {
        const { id } = req.params;
        const { minThreshold, maxThreshold } = req.body;

        if (minThreshold === undefined && maxThreshold === undefined) {
            return res.status(400).json({ message: "minThreshold or maxThreshold is required" });
        }

        res.status(200).json({
            message: `Sensor ${id} threshold updated successfully`,
            sensorId: id,
            thresholds: { minThreshold, maxThreshold },
            configuredBy: req.user.username,
        });
    }
);

export default sensorRoutes;
