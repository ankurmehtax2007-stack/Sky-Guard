import { saveReading, findLatestReadings, countReadingsByStation, findReadingsByStation, findPendingReadings, updateReading } from "./reading.repository.js";
import { predictReading } from "../ml/ml.service.js";
import { saveAnomaly } from "../anomalies/anomaly.service.js";

export const processReading = async (reading) => {

    try {
        const savedReading = await saveReading(reading);
        try {
            const prediction = await predictReading(savedReading);
            if (prediction.isAnomaly) {
                await saveAnomaly(savedReading, prediction);
            }
        } catch (error) {
            console.error(
                "ML service failed:",
                error.message
            );
            // Reading is already safely stored.
            // ML processing can be retried later.
        }

    } catch (error) {
        console.error(
            "Error saving reading:",
            error.message
        );
        throw error;
    }
};

export const retryPendingML = async () => {
    const pendingReadings = await findPendingReadings();
    if (pendingReadings.length === 0) {
        return;
    }
    for (const reading of pendingReadings) {
        try {
            const prediction = await predictReading(reading);
            if (prediction.isAnomaly) {
                await saveAnomaly(reading, prediction);
            }
            await updateReading(
                reading._id,
                { mlStatus: "processed" }
            );

        } catch (error) {
            console.error(
                `ML retry failed for ${reading._id}:`,
                error.message
            );
        }
    }
};

export const fetchLatestReadings = async () => {
    try {
        const readings = await findLatestReadings();
        return readings;
    } catch (error) {
        console.error("Error fetching latest readings:", error.message);
        throw error;
    }
}

export const fetchStationReadings = async (stationId, pageNumber, limitNumber, from, to) => {
    try {
        const skip = (pageNumber - 1) * limitNumber;
        const [readings, total] = await Promise.all([
            findReadingsByStation(stationId, { skip, limit: limitNumber, from, to }),
            countReadingsByStation(stationId , { from , to})
        ]);
        const totalPages = Math.ceil(total / limitNumber);

        return {
            readings,
            pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            }
        };
    } catch (error) {
        console.error("Error fetching station readings: service", error.message);
        throw error;
    }
}
