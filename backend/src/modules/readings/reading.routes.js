import { Router } from "express";
// local modules import
import {
    getLatestReadings,
    getStationReadings,
    getTotalReadingsCount,
} from "./reading.controller.js";

const readingRoutes = Router();

readingRoutes.route("/").get(getLatestReadings);
readingRoutes.route("/stats/count").get(getTotalReadingsCount);
readingRoutes.route("/:stationId").get(getStationReadings);

export default readingRoutes;
