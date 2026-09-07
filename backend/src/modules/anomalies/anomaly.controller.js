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
    const anomalies = await fetchAnomalies(stationId, page, limit, from, to, { sensor, severity, status });
    return res.status(200).json({
        success: true,
        message: "Anomalies fetched successfully",
        data: anomalies
    });
});

export const getAnomalyById = asyncHandler(async (req, res) => {
    const { anomalyId } = req.params;
    const anomaly = await fetchAnomalyById(anomalyId);
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
