import { retryPendingML } from "../readings/reading.service.js";

const startMLRetryWorker = () => {

    setInterval(async () => {
        try {
            await retryPendingML();
        } catch (error) {
            console.error(
                "ML retry worker error:",
                error.message
            );
        }
    }, 30 * 1000); 
};

export default startMLRetryWorker;