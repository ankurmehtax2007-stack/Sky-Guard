import api from "./axios";

// Register
export const registerUser = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  return response.data;
};

// Login
export const loginUser = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials);

  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }

  return response.data;
};

// Logout
export const logoutUser = async () => {
  const response = await api.post("/api/auth/logout");

  localStorage.removeItem("accessToken");

  return response.data;
};

// Get all users
export const getAllUsers = async () => {
  const response = await api.get("/api/auth");
  return response.data;
};

// Get user by ID
export const getUserById = async (id) => {
  const response = await api.get(`/api/auth/${id}`);
  return response.data;
};

// Update user 
export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/auth/${id}`, userData);
  return response.data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await api.delete(`/api/auth/${id}`);
  return response.data;
};