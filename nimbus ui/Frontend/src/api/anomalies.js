import api from "./axios";

export const getAnomalies = async (params = {}) => {
  const response = await api.get("/api/anomalies", { params });
  return response.data;
};

export const getStationAnomalies = async (stationId, params = {}) => {
  const response = await api.get(`/api/anomalies/station/${stationId}`, { params });
  return response.data;
};

export const getAnomalyById = async (anomalyId) => {
  const response = await api.get(`/api/anomalies/${anomalyId}`);
  return response.data;
};

export const updateAnomalyStatus = async (anomalyId, status) => {
  const response = await api.patch(
    `/api/anomalies/${anomalyId}/status`,
    { status }
  );

  return response.data;
};