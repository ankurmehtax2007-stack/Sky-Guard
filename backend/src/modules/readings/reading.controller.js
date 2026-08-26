// local modules import
import { fetchLatestReadings, fetchStationReadings } from "./reading.service.js";
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