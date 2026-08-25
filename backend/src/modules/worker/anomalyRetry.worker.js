import { retryPendingAnomalies } from "../readings/reading.service.js";

const startAnomalyRetryWorker = () => {
    setInterval(async () => {
        try {
            await retryPendingAnomalies();
        } catch (error) {
            console.error(
                "Anomaly retry worker error:",
                error.message
            );
        }
    }, 30 * 1000);
};

export default startAnomalyRetryWorker;