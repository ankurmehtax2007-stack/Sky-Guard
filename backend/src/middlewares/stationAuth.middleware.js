import { stationExists } from "../modules/stations/station.repository.js";
import { findTaskById } from "../modules/tasks/task.repository.js";

export const authorizeStationAccess = (stationIdResolver) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const role = (req.user.role || "").toLowerCase();
        const status = (req.user.status || "PENDING").toUpperCase();

        let requestedStationId = null;
        if (typeof stationIdResolver === "function") {
            requestedStationId = stationIdResolver(req);
        } else if (typeof stationIdResolver === "string") {
            requestedStationId = req.params[stationIdResolver] || req.query[stationIdResolver] || req.body?.[stationIdResolver];
        } else {
            requestedStationId = req.params.stationId || req.params.id || req.query.stationId || req.body?.stationId;
        }

        if (requestedStationId) {
            requestedStationId = String(requestedStationId).trim();
        }

        if (role !== "admin") {
            if (status === "PENDING") {
                return res.status(403).json({
                    message: "Forbidden: Account is pending administrator approval",
                    status: "PENDING",
                });
            }

            if (status === "SUSPENDED") {
                return res.status(403).json({
                    message: "Forbidden: Account is suspended",
                    status: "SUSPENDED",
                });
            }

            if (status === "REJECTED") {
                return res.status(403).json({
                    message: "Forbidden: Account registration was rejected",
                    status: "REJECTED",
                });
            }

            if (!req.user.stationId) {
                return res.status(403).json({
                    message: "Forbidden: No station assigned to this account",
                });
            }

            if (requestedStationId && requestedStationId !== req.user.stationId) {
                return res.status(403).json({
                    message: `Forbidden: You are not authorized to access station ${requestedStationId}`,
                    assignedStation: req.user.stationId,
                    requestedStation: requestedStationId,
                });
            }
        }

        if (requestedStationId) {
            const exists = await stationExists(requestedStationId);
            if (!exists) {
                return res.status(404).json({
                    message: `Station ${requestedStationId} not found`,
                });
            }
        }

        next();
    };
};

export const authorizeTaskAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const role = (req.user.role || "").toLowerCase();
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({ message: "taskId parameter is required" });
        }

        const task = await findTaskById(taskId);
        if (!task) {
            return res.status(404).json({ message: `Task ${taskId} not found` });
        }

        if (role !== "admin") {
            if (!req.user.stationId) {
                return res.status(403).json({ message: "Forbidden: No station assigned to this account" });
            }
            if (task.stationId !== req.user.stationId) {
                return res.status(403).json({
                    message: "Forbidden: This task belongs to a different station",
                    taskStation: task.stationId,
                    yourStation: req.user.stationId,
                });
            }
        }

        req.task = task;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Error validating task access" });
    }
};
