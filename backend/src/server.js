import http from "http";
import app from "./app.js";
import connectDB, { disconnectDB } from "./config/database.js";
import connectMQTT, { stopMQTT } from "./mqtt/mqttClient.js";
import config from "./config/config.js";
import { initializeWebSocket } from "./websocket/websocket.server.js";
import { startMLRetryWorker, stopMLRetryWorker } from "./modules/worker/mlRetry.worker.js";
import { startAnomalyRetryWorker, stopAnomalyRetryWorker } from "./modules/worker/anomalyRetry.worker.js";
import { initStationSeed } from "./modules/stations/station.repository.js";
import { initUserSeed } from "./auth/user.repository.js";
import logger from "./utils/logger.js";

const startServer = async () => {
    try {
        await connectDB(); 
        await initStationSeed();
        await initUserSeed();
        connectMQTT();
        logger.info("Backend started successfully");
    } catch (error) {
        logger.error({ error }, "Failed to start backend");
        throw error;
    }
};

const closeHTTPServer = () => {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            logger.info("HTTP server closed");
            resolve();
        });
    });
};

const server = http.createServer(app);
const wss = initializeWebSocket(server);

const bootstrap = async () => {
    try {
        await startServer();
        startMLRetryWorker();
        startAnomalyRetryWorker();

        const PORT = config.port || 8000;
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        // Do not accept requests that could be mistaken for persisted writes
        // when the database has not connected successfully.
        logger.fatal({ error }, "Backend could not start because MongoDB is unavailable");
        process.exitCode = 1;
    }
};

const shutdownServer = async () => {
    logger.info("Shutting down server...");
    try {
        stopMLRetryWorker();
        stopAnomalyRetryWorker();
        await stopMQTT();
        for (const client of wss.clients) {
            client.close();
        }
        await closeHTTPServer();
        await disconnectDB();
    } catch (error) {
        logger.error({ error }, "Error shutting down server");
    }
}

process.on("SIGTERM", shutdownServer);
process.on("SIGINT", shutdownServer);

bootstrap();
