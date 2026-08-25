import { saveReading, findLatestReadings, countReadingsByStation, findReadingsByStation, findPendingReadings, updateReading, findDetectedAnomalies } from "./reading.repository.js";
import { predictReading } from "../ml/ml.service.js";
import { saveAnomaly } from "../anomalies/anomaly.service.js";
import { broadcast } from "../../websocket/websocket.manager.js";

export const processReading = async (reading) => {

    try {
        const savedReading = await saveReading(reading);
        try {
            broadcast({
                type: "READING_UPDATED",
                data: savedReading
            });
        } catch (error) {
            console.error("Error broadcasting reading: service", error.message);
        }
        try {
            const prediction = await predictReading(savedReading);
            await updateReading(
                savedReading._id,
                { mlStatus: "processed", anomalyStatus: prediction.isAnomaly ? "detected" : "none", anomalyPrediction: prediction }
            );
            if (prediction.isAnomaly) {
                try {
                    await saveAnomaly(savedReading, prediction);
                    await updateReading(
                        savedReading._id,
                        { anomalyStatus: "saved" }
                    );
                } catch (error) {
                    console.error("Error saving anomaly: service", error.message);
                }
            }
        } catch (error) {
            console.error(
                "ML service failed:",
                error.message
            );
        }
    } catch (error) {
        console.error(
            "Error saving reading:",
            error.message
        );
        throw error;
    }
};

export const retryPendingAnomalies = async () => {
    const detectedAnomalies = await findDetectedAnomalies();
    if (detectedAnomalies.length === 0) {
        return;
    }
    for (const anomaly of detectedAnomalies) {
        try {
            const anomalyData = anomaly.anomalyPrediction;
            await saveAnomaly(anomaly.readingId, anomalyData);
            await updateReading(
                anomaly.readingId,
                { anomalyStatus: "saved" }
            );
        } catch (error) {
            console.error(
                `Anomaly retry failed for ${anomaly.readingId}:`,
                error.message
            );
        }
    }
}

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
            countReadingsByStation(stationId, { from, to })
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
