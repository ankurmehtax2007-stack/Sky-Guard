import { saveReading, findLatestReadings, countReadingsByStation, findReadingsByStation, findPendingReadings, updateReading, findDetectedAnomalies, findReadingById } from "./reading.repository.js";
import { predictReading } from "../ml/ml.service.js";
import { saveAnomaly } from "../anomalies/anomaly.service.js";
import { broadcast } from "../../websocket/websocket.manager.js";
import logger from "../../utils/logger.js";
import { anomaliesDetected, mlFailures, mlPredictionDuration } from "../../utils/metrics.js";

export const processReading = async (reading) => {

    try {
        const savedReading = await saveReading(reading);
        try {
            broadcast({
                type: "READING_UPDATED",
                data: savedReading
            });
        } catch (error) {
            logger.error(
                {
                    err: error,
                    readingId: savedReading._id
                },
                "Error broadcasting reading"
            );
        }
        const end = mlPredictionDuration.startTimer();
        try {
            const prediction = await predictReading(savedReading);
            if (prediction.isAnomaly) {
                try {
                    anomaliesDetected.inc();
                    await saveAnomaly(savedReading, prediction);
                    const updatedReading = await updateReading(
                        savedReading._id,
                        { mlStatus: "processed", anomalyStatus: "saved", anomalyPrediction: prediction }
                    );
                    try {
                        broadcast({
                            type: "READING_UPDATED",
                            data: updatedReading
                        });
                    } catch (err) {}
                } catch (error) {
                    logger.error(
                        {
                            err: error,
                            readingId: savedReading._id
                        },
                        "Error saving anomaly"
                    );
                    await updateReading(
                        savedReading._id,
                        { mlStatus: "processed", anomalyStatus: "detected", anomalyPrediction: prediction }
                    );
                }
            } else {
                await updateReading(
                    savedReading._id,
                    { mlStatus: "processed", anomalyStatus: "none", anomalyPrediction: prediction }
                );
            }
        } catch (error) {
            mlFailures.inc();
            logger.error(
                {
                    err: error,
                    readingId: savedReading._id
                },
                "ML service failed"
            );
        } finally {
            end();
        }
    } catch (error) {
        logger.error({ err: error }, "Error saving reading");
        throw error;
    }
};

export const retryPendingAnomalies = async () => {

    const detectedReadings = await findDetectedAnomalies();

    if (detectedReadings.length === 0) {
        return;
    }

    for (const reading of detectedReadings) {

        try {

            const prediction = reading.anomalyPrediction;

            await saveAnomaly(reading, prediction);

            await updateReading(
                reading._id,
                { anomalyStatus: "saved" }
            );

        } catch (error) {

            if (error.code === 11000) {

                logger.info(
                    { readingId: reading._id },
                    "Anomaly already exists"
                );

                await updateReading(
                    reading._id,
                    { anomalyStatus: "saved" }
                );

            } else if (error.name === "ValidationError") {

                logger.error(
                    { err: error, readingId: reading._id },
                    "Anomaly retry skipped: stored prediction is invalid and cannot be saved"
                );

                await updateReading(
                    reading._id,
                    { anomalyStatus: "saved" }
                );

            } else {

                logger.error(
                    {
                        err: error,
                        readingId: reading._id
                    },
                    "Anomaly retry failed"
                );
            }
        }
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

            await updateReading(
                reading._id,
                {
                    mlStatus: "processed",
                    anomalyStatus: prediction.isAnomaly
                        ? "detected"
                        : "none",
                    anomalyPrediction: prediction
                }
            );

            if (prediction.isAnomaly) {

                try {

                    await saveAnomaly(reading, prediction);

                    await updateReading(
                        reading._id,
                        {
                            anomalyStatus: "saved"
                        }
                    );

                } catch (error) {

                    if (error.code === 11000) {

                        logger.info(
                            { readingId: reading._id },
                            "Anomaly already exists"
                        );

                        await updateReading(
                            reading._id,
                            {
                                anomalyStatus: "saved"
                            }
                        );

                    } else {

                        logger.error(
                            {
                                err: error,
                                readingId: reading._id
                            },
                            "Anomaly save failed during ML retry"
                        );
                    }
                }
            }

        } catch (error) {

            logger.error(
                {
                    err: error,
                    readingId: reading._id
                },
                "ML retry failed"
            );
        }
    }
};

export const fetchLatestReadings = async (stationId = null) => {
    const readings = await findLatestReadings(stationId);
    return readings;
};

export const fetchStationReadings = async (stationId, pageNumber, limitNumber, from, to) => {
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
};

