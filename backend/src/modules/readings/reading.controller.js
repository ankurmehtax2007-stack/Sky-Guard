// local modules import
import { fetchLatestReadings, fetchStationReadings } from "./reading.service.js";
import { paginationSchema } from "./reading.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const getLatestReadings = asyncHandler(async (req, res) => {
    const userRole = (req.user?.role || "").toLowerCase();
    const userStatus = (req.user?.status || "PENDING").toUpperCase();

    let targetStationId = null;

    if (userRole === "admin") {
        targetStationId = req.query.stationId ? String(req.query.stationId).trim() : null;
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
        targetStationId = req.user.stationId;
    }

    const readings = await fetchLatestReadings(targetStationId);
    res.status(200).json({
        success: true,
        message: "Latest readings fetched successfully",
        data: readings,
    });
});

export const getStationReadings = asyncHandler(async (req, res) => {
    const { stationId } = req.params;
    const result = paginationSchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid pagination parameters",
            error: result.error
        });
    }
    const { page, limit, from, to } = result.data;
    const readings = await fetchStationReadings(stationId, page, limit, from, to);
    res.status(200).json({
        success: true,
        message: "Station readings fetched successfully",
        data: readings,
    });
});