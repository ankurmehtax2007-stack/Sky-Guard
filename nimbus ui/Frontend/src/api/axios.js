import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, 
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // City scope is only sent for GET requests. Never leak an old admin
    // selection into an engineer/operator session. Non-admin users use the
    // city stored on their authenticated account.
    if (config.method?.toLowerCase() === "get") {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const role = String(storedUser?.role || "").toLowerCase();
        const selectedCity = role === "admin"
          ? localStorage.getItem("nimbus_admin_city")
          : storedUser?.city || null;
        if (selectedCity && selectedCity !== "All Cities") {
          config.params = { ...(config.params || {}), city: selectedCity };
        }
      } catch {
        // Ignore malformed local user data; the bearer token still authenticates.
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;