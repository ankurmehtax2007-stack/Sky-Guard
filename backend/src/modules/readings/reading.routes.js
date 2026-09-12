import { Router } from "express";
import {
    getLatestReadings,
    getStationReadings,
} from "./reading.controller.js";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const readingRoutes = Router();

readingRoutes.route("/").get(authenticateUser, authorize(PERMISSIONS.SENSORS_READ), getLatestReadings);
readingRoutes.route("/:stationId").get(
    authenticateUser,
    authorize(PERMISSIONS.SENSORS_READ),
    authorizeStationAccess("stationId"),
    getStationReadings
);

export default readingRoutes;
