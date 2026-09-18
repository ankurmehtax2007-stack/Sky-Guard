import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, logoutUser } from "../api/auth";
import { parseApiError } from "../utils/formatters";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  const expiry = Number(payload?.exp);
  return Number.isFinite(expiry) && expiry * 1000 > Date.now();
}

function readStoredUser() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    // A partially written or older-format value must never prevent the app
    // from mounting. The valid JWT still contains the required identity data.
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let token = localStorage.getItem("accessToken");
      if (!token || !isTokenValid(token)) {
        try {
          const res = await api.post("/api/auth/refresh");
          if (res.data?.accessToken) {
            token = res.data.accessToken;
            localStorage.setItem("accessToken", token);
          }
        } catch {
          // Refresh token invalid or absent
        }
      }

      if (token && isTokenValid(token)) {
        const payload = parseJwt(token);
        const storedUser = readStoredUser();
        setUser({
          id: storedUser?.id || payload?.id || payload?.sub,
          username: storedUser?.username || payload?.username,
          email: storedUser?.email || payload?.email,
          role: String(payload?.role || storedUser?.role || "operator").toLowerCase(),
          stationId: storedUser?.stationId || payload?.stationId || null,
          city: storedUser?.city || payload?.city || null,
        });
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
      setIsInitializing(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    const payload = parseJwt(data.accessToken);
    const userInfo = {
      id: data.user?._id || payload?.id,
      username: data.user?.username || payload?.username,
      email: data.user?.email || payload?.email,
      role: String(data.user?.role || payload?.role || "operator").toLowerCase(),
      stationId: data.user?.stationId || payload?.stationId || null,
      city: data.user?.city || payload?.city || null,
    };
    setUser(userInfo);
    localStorage.setItem("user", JSON.stringify(userInfo));
    setIsAuthenticated(true);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if backend logout fails, clear local state
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const role = user?.role || "operator";

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
