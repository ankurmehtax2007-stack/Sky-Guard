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
  try {
    console.log("Creating user:", userData);

    const response = await api.post("/api/users", userData);

    console.log("Create user response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Create user failed:", error);
    console.error("Status:", error?.response?.status);
    console.error("Response:", error?.response?.data);

    throw error;
  }
};

export const getAllUsers = async () => {
  const response = await api.get("/api/users");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};