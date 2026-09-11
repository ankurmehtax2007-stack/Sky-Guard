// local modules import
import { fetchLatestReadings, fetchStationReadings, fetchTotalReadingsCount } from "./reading.service.js";
import { paginationSchema } from "./reading.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const getLatestReadings = asyncHandler(async (req, res) => {
    const readings = await fetchLatestReadings();
    res.status(200).json({
        success: true,
        message: "Latest readings fetched successfully",
        data: readings,
    });
});

export const getTotalReadingsCount = asyncHandler(async (req, res) => {
    const stationIds = req.query.stations ? req.query.stations.split(",") : null;
    const total = await fetchTotalReadingsCount(stationIds);
    res.status(200).json({
        success: true,
        message: "Total readings count fetched successfully",
        data: { total },
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