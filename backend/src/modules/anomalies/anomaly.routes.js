import { Router } from "express";
import { getAnomalies, getAnomalyById, getStationAnomalies, updateAnomalyStatusController } from "./anomaly.controller.js";
import { optionalAuthenticateUser } from "../../auth/auth.middleware.js";

const anomalyRouter = Router();

anomalyRouter.get("/", getAnomalies);
anomalyRouter.get("/station/:stationId", getStationAnomalies);
anomalyRouter.get("/:anomalyId", getAnomalyById);
anomalyRouter.patch("/:anomalyId/status", optionalAuthenticateUser, updateAnomalyStatusController);

export default anomalyRouter;
