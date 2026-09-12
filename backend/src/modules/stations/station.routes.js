import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";
import { findAllStations, findStationById, createStation } from "./station.repository.js";

const stationRoutes = Router();

// GET /api/stations -> Role & Station Scoped retrieval
stationRoutes.get("/", authenticateUser, authorize(PERMISSIONS.STATIONS_READ), async (req, res) => {
    try {
        const userRole = (req.user?.role || "").toLowerCase();
        const userStatus = (req.user?.status || "PENDING").toUpperCase();

        // 1. Suspended accounts cannot access stations
        if (userRole !== "admin" && userStatus === "SUSPENDED") {
            return res.status(403).json({
                message: "Forbidden: Account is suspended",
                status: "SUSPENDED",
            });
        }

        // 2. Pending accounts receive an empty list indicating station assignment is pending
        if (userRole !== "admin" && userStatus === "PENDING") {
            return res.status(200).json({
                message: "Station assignment pending",
                stations: [],
            });
        }

        // 3. Admin receives all stations
        if (userRole === "admin") {
            const allStations = await findAllStations();
            return res.status(200).json({
                message: "Stations retrieved successfully",
                stations: allStations,
            });
        }

        // 4. Non-admin receives ONLY their assigned station
        if (!req.user.stationId) {
            return res.status(200).json({
                message: "No station assigned",
                stations: [],
            });
        }

        const assignedStation = await findStationById(req.user.stationId);
        const stations = assignedStation ? [assignedStation] : [];

        return res.status(200).json({
            message: "Assigned station retrieved successfully",
            stations,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving stations" });
    }
});

// GET /api/stations/:stationId -> Protected Station Details
stationRoutes.get(
    "/:stationId",
    authenticateUser,
    authorize(PERMISSIONS.STATIONS_READ),
    authorizeStationAccess("stationId"),
    async (req, res) => {
        try {
            const { stationId } = req.params;
            const station = await findStationById(stationId);
            if (!station) {
                return res.status(404).json({ message: `Station ${stationId} not found` });
            }
            return res.status(200).json({
                message: "Station details retrieved successfully",
                station,
            });
        } catch (error) {
            return res.status(500).json({ message: "Error retrieving station details" });
        }
    }
);

// POST /api/stations -> ADMIN, ENGINEER (stations:create)
stationRoutes.post("/", authenticateUser, authorize(PERMISSIONS.STATIONS_CREATE), async (req, res) => {
    try {
        const { id, name, location, status } = req.body;
        if (!id || !name) {
            return res.status(400).json({ message: "Station id and name are required" });
        }
        const createdStation = await createStation({
            id,
            name,
            location: location || { lat: 0, lng: 0 },
            status: status || "active",
            createdBy: req.user.username,
        });
        res.status(201).json({
            message: "Station registered successfully",
            station: createdStation,
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "Error registering station" });
    }
});

export default stationRoutes;
