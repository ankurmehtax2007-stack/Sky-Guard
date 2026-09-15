import api from "./axios";

export const registerUser = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials);

  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/api/auth/logout");

  localStorage.removeItem("accessToken");

  return response.data;
};


export const createUser = async (userData) => {
  // The backend hashes the password and persists the user in MongoDB.
  // Prefer the existing registration route; support the common admin CRUD
  // POST route as a compatibility fallback.
  try {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      const response = await api.post("/api/auth", userData);
      return response.data;
    }
    throw error;
  }
};

export const getAllUsers = async () => {
  const response = await api.get("/api/auth");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/api/auth/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/auth/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/api/auth/${id}`);
  return response.data;
};