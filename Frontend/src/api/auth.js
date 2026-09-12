import api from "./axios";

// Register
export const registerUser = async (userData) => {
  const response = await api.post("/api/auth/register", userData);

  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

// Login
export const loginUser = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials);

  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

// Logout
export const logoutUser = async () => {
  try {
    const response = await api.post("/api/auth/logout");
    return response.data;
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }
};

// Get current user profile
export const getMe = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

// Refresh access token via HTTP-only cookie
export const refreshToken = async () => {
  const response = await api.post("/api/auth/refresh");
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }
  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
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