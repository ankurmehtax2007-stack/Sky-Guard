import express from "express";
import readingRoutes from "./modules/readings/reading.routes.js";
import anomalyRouter from "./modules/anomalies/anomaly.routes.js";
import startMLRetryWorker from "./modules/worker/mlRetry.worker.js";
import startAnomalyRetryWorker from "./modules/worker/anomalyRetry.worker.js";
import authRoutes from "./auth/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//auth - routes
app.use("/api/auth", authRoutes)
// Routes
app.use("/api/readings", readingRoutes);
app.use("/api/anomalies", anomalyRouter);

startMLRetryWorker();
startAnomalyRetryWorker();

export default app;
