import { anomalyPaginationSchema, anomalyStatusSchema } from "./anomaly.validator.js";
import { fetchAnomalies, fetchAnomalyById, updateAnomalyStatus } from "./anomaly.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const getAnomalies = asyncHandler(async (req, res) => {
    const result = anomalyPaginationSchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid query parameters",
            error: result.error.issues
        });
    }
    const { stationId, page, limit, from, to, sensor, severity, status } = result.data;
    const userRole = (req.user?.role || "").toLowerCase();
    const userStatus = (req.user?.status || "PENDING").toUpperCase();

    let targetStationId = null;

    if (userRole === "admin") {
        targetStationId = stationId ? String(stationId).trim() : null;
    } else {
        if (userStatus === "PENDING") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is pending station assignment by an administrator",
            });
        }
        if (userStatus === "SUSPENDED") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is suspended",
            });
        }
        if (!req.user?.stationId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: No station assigned to this account",
            });
        }
        if (stationId && String(stationId).trim() !== req.user.stationId) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: You are not authorized to access anomalies for station ${stationId}`,
            });
        }
        targetStationId = req.user.stationId;
    }

    const anomalies = await fetchAnomalies(targetStationId, page, limit, from, to, { sensor, severity, status });
    return res.status(200).json({
        success: true,
        message: "Anomalies fetched successfully",
        data: anomalies
    });
});

export const getAnomalyById = asyncHandler(async (req, res) => {
    const { anomalyId } = req.params;
    const anomaly = await fetchAnomalyById(anomalyId);
    if (!anomaly) {
        return res.status(404).json({ success: false, message: "Anomaly not found" });
    }

    const userRole = (req.user?.role || "").toLowerCase();
    const userStatus = (req.user?.status || "PENDING").toUpperCase();

    if (userRole !== "admin") {
        if (userStatus === "PENDING") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is pending station assignment by an administrator",
            });
        }
        if (userStatus === "SUSPENDED") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is suspended",
            });
        }
        if (anomaly.stationId !== req.user?.stationId) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: You are not authorized to view anomalies from station ${anomaly.stationId}`,
            });
        }
    }

    return res.status(200).json({
        success: true,
        message: "Anomaly fetched successfully",
        data: anomaly
    });
});

export const updateAnomalyStatusController = asyncHandler(async (req, res) => {
    const result = anomalyStatusSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid anomaly status parameters",
            error: result.error.issues
        });
    }
    const { anomalyId } = req.params;
    const anomaly = await fetchAnomalyById(anomalyId);
    if (!anomaly) {
        return res.status(404).json({ success: false, message: "Anomaly not found" });
    }

    const userRole = (req.user?.role || "").toLowerCase();
    const userStatus = (req.user?.status || "PENDING").toUpperCase();

    if (userRole !== "admin") {
        if (userStatus === "PENDING") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is pending station assignment by an administrator",
            });
        }
        if (userStatus === "SUSPENDED") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Account is suspended",
            });
        }
        if (anomaly.stationId !== req.user?.stationId) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: You are not authorized to update anomalies for station ${anomaly.stationId}`,
            });
        }
    }

    const { status, resolvedBy } = result.data;
    const operator = req.user?.username || req.user?.email || req.user?.id || resolvedBy || "Operator";
    const updatedAnomaly = await updateAnomalyStatus(anomalyId, status, operator);
    return res.status(200).json({
        success: true,
        message: "Anomaly status updated successfully",
        data: updatedAnomaly
    });
});

export const getStationAnomalies = asyncHandler(async (req, res) => {
    const { stationId } = req.params;
    const result = anomalyPaginationSchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid query parameters",
            error: result.error.issues
        });
    }
    const { page, limit, from, to, sensor, severity, status } = result.data;
    const anomalies = await fetchAnomalies(stationId, page, limit, from, to, { sensor, severity, status });
    return res.status(200).json({
        success: true,
        message: "Anomalies fetched successfully",
        data: anomalies
    });
});
