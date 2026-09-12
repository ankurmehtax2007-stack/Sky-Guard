import mongoose from "mongoose";
import { Station } from "./station.model.js";
import logger from "../../utils/logger.js";

export const DEFAULT_STATIONS = [
    { id: "AWS_01", name: "Station Alpha (Delhi NCR Hub)", status: "active", location: { lat: 28.6139, lng: 77.2090 } },
    { id: "AWS_02", name: "Station Beta (Mumbai Radar)", status: "active", location: { lat: 19.0760, lng: 72.8777 } },
    { id: "AWS_03", name: "Station Gamma (Bengaluru Craton)", status: "active", location: { lat: 12.9716, lng: 77.5946 } },
];

let inMemoryStations = [...DEFAULT_STATIONS];

export const initStationSeed = async () => {
    if (mongoose.connection.readyState === 1) {
        try {
            for (const station of DEFAULT_STATIONS) {
                await Station.findOneAndUpdate(
                    { id: station.id },
                    { $set: station },
                    { upsert: true, new: true }
                );
            }
            const validIds = DEFAULT_STATIONS.map((s) => s.id);
            await Station.deleteMany({ id: { $nin: validIds } });
            logger.info("Simulator stations (AWS_01, AWS_02, AWS_03) synced in MongoDB");
        } catch (error) {
            logger.warn({ error }, "Station seeding encountered non-fatal error");
        }
    }
};

export const findAllStations = async () => {
    if (mongoose.connection.readyState === 1) {
        try {
            const stations = await Station.find().lean();
            if (stations && stations.length > 0) {
                return stations.map((s) => ({
                    id: s.id,
                    name: s.name,
                    status: s.status,
                    location: s.location,
                    createdBy: s.createdBy,
                }));
            }
        } catch (error) {
            logger.warn({ error }, "Error querying stations from DB, falling back to in-memory list");
        }
    }
    return inMemoryStations;
};

export const findStationById = async (stationId) => {
    if (!stationId) return null;
    const normalizedId = String(stationId).trim();

    if (mongoose.connection.readyState === 1) {
        try {
            const station = await Station.findOne({ id: normalizedId }).lean();
            if (station) {
                return {
                    id: station.id,
                    name: station.name,
                    status: station.status,
                    location: station.location,
                    createdBy: station.createdBy,
                };
            }
        } catch (error) {
            logger.warn({ error }, "Error querying station by id from DB, falling back to in-memory list");
        }
    }
    return inMemoryStations.find((s) => s.id === normalizedId) || null;
};

export const stationExists = async (stationId) => {
    const station = await findStationById(stationId);
    return Boolean(station);
};

export const createStation = async (stationData) => {
    const { id, name, location, status = "active", createdBy = "system" } = stationData;
    const newStation = {
        id,
        name,
        status,
        location: location || { lat: 0, lng: 0 },
        createdBy,
    };

    if (mongoose.connection.readyState === 1) {
        try {
            const created = await Station.create(newStation);
            return {
                id: created.id,
                name: created.name,
                status: created.status,
                location: created.location,
                createdBy: created.createdBy,
            };
        } catch (error) {
            logger.error({ error }, "Error saving station to DB");
            throw error;
        }
    }

    inMemoryStations.push(newStation);
    return newStation;
};
