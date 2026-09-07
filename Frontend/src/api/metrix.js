import api from "./axios";

export const getMetrics = async () => {
    const response = await api.get("/metrics");
    return response.data;
};