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
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && isTokenValid(token)) {
      const payload = parseJwt(token);
      setUser({
        id: payload.id || payload.sub,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      });
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("accessToken");
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    const payload = parseJwt(data.accessToken);
    const userInfo = {
      id: data.user?._id || payload?.id,
      username: data.user?.username || payload?.username,
      email: data.user?.email || payload?.email,
      role: data.user?.role || payload?.role,
    };
    setUser(userInfo);
    setIsAuthenticated(true);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if backend logout fails, clear local state
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
