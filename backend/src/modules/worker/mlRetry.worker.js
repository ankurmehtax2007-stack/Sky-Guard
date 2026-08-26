import { retryPendingML } from "../readings/reading.service.js";
import logger from "../../utils/logger.js";

let mlRetryInterval = null;

export const startMLRetryWorker = () => {

    mlRetryInterval = setInterval(async () => {
        try {
            await retryPendingML();
        } catch (error) {
            logger.error({ error }, "ML retry worker error");
        }
    }, 30 * 1000); 
};

export const stopMLRetryWorker = () => {
    if (mlRetryInterval) {
        clearInterval(mlRetryInterval);
        mlRetryInterval = null;
        logger.info("ML retry worker stopped");
    }
};
