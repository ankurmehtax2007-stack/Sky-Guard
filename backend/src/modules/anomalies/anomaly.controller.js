import { paginationSchema } from "../readings/reading.validator.js";
import { fetchAnomalies, fetchAnomalyById, updateAnomalyStatus } from "./anomaly.service.js";

export const getAnomalies = async (req, res) => {
    try {
        const result = paginationSchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                error: result.error.issues
            });
        }
        const { stationId, page, limit, from, to } = result.data;
        const anomalies = await fetchAnomalies(stationId, page , limit , from, to);
        return res.status(200).json({
            success: true,
            message: "Anomalies fetched successfully",
            data: anomalies
        });

    } catch (error) {
        console.error(
            "Error fetching anomalies: controller",
            error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to fetch anomalies"
        });
    }
};

export const getAnomalyById = async (req, res) => {
    try {
        const { anomalyId } = req.params;
        const anomaly = await fetchAnomalyById(anomalyId);
        return res.status(200).json({
            success: true,
            message: "Anomaly fetched successfully",
            data: anomaly
        });
    } catch (error) {
        console.error("Error fetching anomaly by id: controller", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch anomaly"
        });
    }
};

export const updateAnomalyStatusController = async (req , res) => {
    try {
        const result = anomalyStatusSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid anomaly status parameters",
                error: result.error.issues
            });
        }
        const { anomalyId } = req.params;
        const { status } = result.data;
        const updatedAnomaly = await updateAnomalyStatus(anomalyId , status , req.user.id);
        return res.status(200).json({
            success: true,
            message: "Anomaly status updated successfully",
            data: updatedAnomaly
        });
    } catch (error) {
        console.error("Error updating anomaly status: controller", error.message);
        return res.status(404).json({
            success: false,
            message: "Failed to update anomaly status"
        });
    }
}

export const getStationAnomalies = async (req, res) => {
    try {
        const { stationId } = req.params;
        const result = paginationSchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                error: result.error.issues
            });
        }
        const { page, limit, from, to } = result.data;
        const anomalies = await fetchAnomalies(stationId, page , limit , from, to);
        return res.status(200).json({
            success: true,
            message: "Anomalies fetched successfully",
            data: anomalies
        });
    } catch (error) {
        console.error(
            "Error fetching anomalies: controller",
            error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to fetch anomalies"
        });
    }
};
