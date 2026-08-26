import { retryPendingAnomalies } from "../readings/reading.service.js";
import logger from "../../utils/logger.js";

let retryInterval = null;

export const startAnomalyRetryWorker = () => {
    retryInterval = setInterval(async () => {
        try {
            await retryPendingAnomalies();
        } catch (error) {
            logger.error({ error }, "Anomaly retry worker error");
        }
    }, 30 * 1000);
};

export const stopAnomalyRetryWorker = () => {
    if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
        logger.info("Anomaly retry worker stopped");
    }
};
