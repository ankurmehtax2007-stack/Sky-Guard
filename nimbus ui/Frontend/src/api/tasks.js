import api from "./axios";

export const getTasks = async (params = {}) => {
  const response = await api.get("/api/tasks", { params });
  return response.data;
};

export const getMyTasks = async (params = {}) => {
  const response = await api.get("/api/tasks/my", { params });
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post("/api/tasks", taskData);
  return response.data;
};

export const assignTask = async (taskId, engineerId) => {
  const response = await api.patch(`/api/tasks/${taskId}/assign`, { engineerId });
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/api/tasks/${taskId}/status`, { status });
  return response.data;
};

export const addTaskNote = async (taskId, content) => {
  const response = await api.post(`/api/tasks/${taskId}/notes`, { content });
  return response.data;
};

// Requires the backend task-assignment engineer-list endpoint.
export const getAssignableEngineers = async (stationId, city) => {
  const params = {};
  if (stationId) params.stationId = stationId;
  if (city) params.city = city;
  const response = await api.get("/api/tasks/engineers", { params });
  return response.data;
};
