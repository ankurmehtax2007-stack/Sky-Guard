import express from "express";
import readingRoutes from "./modules/readings/reading.routes.js";
import anomalyRouter from "./modules/anomalies/anomaly.routes.js";
import authRoutes from "./auth/auth.routes.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import healthRoutes from "./health/health.routes.js";
import pinoHttp from "pino-http";
import logger from "./utils/logger.js";
import register from "./utils/metrics.js";
import cors from "cors";

const app = express();
app.use(pinoHttp({ logger }));

app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//auth - routes
app.use("/api/auth", authRoutes)
// Routes
app.use("/api/readings", readingRoutes);
app.use("/api/anomalies", anomalyRouter);
app.use("/api/health", healthRoutes);
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.use(errorHandler);

export default app;
