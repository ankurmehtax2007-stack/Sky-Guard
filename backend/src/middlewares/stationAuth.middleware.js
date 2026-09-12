import { stationExists } from "../modules/stations/station.repository.js";

export const authorizeStationAccess = (stationIdResolver) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const role = (req.user.role || "").toLowerCase();
        const status = (req.user.status || "PENDING").toUpperCase();

        // 1. Resolve target stationId from request
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

        // 2. Check if the user is PENDING or SUSPENDED
        // Prompt rule: PENDING and SUSPENDED non-admin users cannot access station data
        if (role !== "admin") {
            if (status === "PENDING") {
                return res.status(403).json({
                    message: "Forbidden: Account is pending station assignment by an administrator",
                    status: "PENDING",
                });
            }

            if (status === "SUSPENDED") {
                return res.status(403).json({
                    message: "Forbidden: Account is suspended",
                    status: "SUSPENDED",
                });
            }

            // User must have an assigned station
            if (!req.user.stationId) {
                return res.status(403).json({
                    message: "Forbidden: No station assigned to this account",
                });
            }

            // Non-admin can ONLY access their assigned station
            if (requestedStationId && requestedStationId !== req.user.stationId) {
                return res.status(403).json({
                    message: `Forbidden: You are not authorized to access station ${requestedStationId}`,
                    assignedStation: req.user.stationId,
                    requestedStation: requestedStationId,
                });
            }
        }

        // 3. If a stationId was specified, verify the station actually exists
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
