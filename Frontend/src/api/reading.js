import api from "./axios";

export const getLatestReadings = async () => {
  const response = await api.get("/api/readings");
  return response.data;
};
export const getStationReadings = async (stationId, params = {}) => {
  const response = await api.get(`/api/readings/${stationId}`, { params });
  return response.data;
};

export const getTotalReadingsCount = async (stations = null) => {
  const params = stations ? { stations: Array.isArray(stations) ? stations.join(",") : stations } : {};
  const response = await api.get("/api/readings/stats/count", { params });
  return response.data;
};