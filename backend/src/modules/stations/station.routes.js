import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";

const stationRoutes = Router();

// GET /api/stations -> All authenticated roles (stations:read)
stationRoutes.get("/", authenticateUser, authorize(PERMISSIONS.STATIONS_READ), (req, res) => {
    res.status(200).json({
        message: "Stations retrieved successfully",
        stations: [
            { id: "STATION_DELHI_01", name: "Delhi Central AWS", status: "active", location: { lat: 28.6139, lng: 77.2090 } },
            { id: "STATION_MUMBAI_02", name: "Mumbai Coastal AWS", status: "active", location: { lat: 19.0760, lng: 72.8777 } },
            { id: "STATION_KOLKATA_03", name: "Kolkata Hub AWS", status: "active", location: { lat: 22.5726, lng: 88.3639 } },
        ],
    });
});

// POST /api/stations -> ADMIN, ENGINEER (stations:create)
stationRoutes.post("/", authenticateUser, authorize(PERMISSIONS.STATIONS_CREATE), (req, res) => {
    const { id, name, location } = req.body;
    if (!id || !name) {
        return res.status(400).json({ message: "Station id and name are required" });
    }
    res.status(201).json({
        message: "Station registered successfully",
        station: { id, name, location: location || { lat: 0, lng: 0 }, createdBy: req.user.username },
    });
});

export default stationRoutes;
