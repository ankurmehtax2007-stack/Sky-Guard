import express from "express";
import readingRoutes from "./modules/readings/reading.routes.js";
import startMLRetryWorker from "./modules/worker/mlRetry.worker.js";
import anomalyRouter from "./modules/anomalies/anomaly.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.use("/api/readings", readingRoutes);
app.use("/api/anomalies", anomalyRouter);

startMLRetryWorker();

export default app;

