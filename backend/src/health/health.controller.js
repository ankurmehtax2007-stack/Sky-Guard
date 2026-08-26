import { checkHealth } from "./health.service.js";

export const getHealth = async (req, res) => {

    const health = await checkHealth();

    return res
        .status(health.status === "healthy" ? 200 : 503)
        .json({
            success: health.status === "healthy",
            ...health
        });
};