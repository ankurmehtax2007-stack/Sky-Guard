import { Router } from "express";
import { getAnomalies, getAnomalyById, getStationAnomalies, updateAnomalyStatusController } from "./anomaly.controller.js";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const anomalyRouter = Router();

anomalyRouter.get("/", authenticateUser, authorize(PERMISSIONS.ANOMALIES_READ), getAnomalies);
anomalyRouter.get(
    "/station/:stationId",
    authenticateUser,
    authorize(PERMISSIONS.ANOMALIES_READ),
    authorizeStationAccess("stationId"),
    getStationAnomalies
);
anomalyRouter.get("/:anomalyId", authenticateUser, authorize(PERMISSIONS.ANOMALIES_READ), getAnomalyById);
anomalyRouter.patch(
    "/:anomalyId/status",
    authenticateUser,
    authorize([PERMISSIONS.ALERTS_ACKNOWLEDGE, PERMISSIONS.ALERTS_RESOLVE]),
    updateAnomalyStatusController
);

export default anomalyRouter;
