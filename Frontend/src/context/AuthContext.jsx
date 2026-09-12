import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, getMe, refreshToken } from "../api/auth";

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
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("accessToken");
    return !!token && isTokenValid(token);
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Synchronize and verify session with backend on startup
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const token = localStorage.getItem("accessToken");

      if (token && isTokenValid(token)) {
        try {
          const data = await getMe();
          if (isMounted && data?.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        } catch {
          // If token verification failed, try refreshing
          try {
            const refreshData = await refreshToken();
            if (isMounted && refreshData?.user) {
              setUser(refreshData.user);
              setIsAuthenticated(true);
              localStorage.setItem("user", JSON.stringify(refreshData.user));
            }
          } catch {
            if (isMounted) {
              setUser(null);
              setIsAuthenticated(false);
              localStorage.removeItem("accessToken");
              localStorage.removeItem("user");
            }
          }
        }
      } else if (token) {
        // Token expired, attempt refresh
        try {
          const refreshData = await refreshToken();
          if (isMounted && refreshData?.user) {
            setUser(refreshData.user);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(refreshData.user));
          }
        } catch {
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("user");
        }
      }

      if (isMounted) {
        setIsInitializing(false);
      }
    }

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener("auth:expired", handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    const payload = parseJwt(data.accessToken);

    const userInfo = {
      id: data.user?.id || data.user?._id || payload?.id || payload?.userId,
      username: data.user?.username || payload?.username,
      email: data.user?.email || payload?.email,
      role: data.user?.role || payload?.role || "viewer",
    };

    setUser(userInfo);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userInfo));
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await registerUser(userData);
    const payload = parseJwt(data.accessToken);

    const userInfo = {
      id: data.user?.id || data.user?._id || payload?.id || payload?.userId,
      username: data.user?.username || payload?.username,
      email: data.user?.email || payload?.email,
      role: data.user?.role || payload?.role || "viewer",
    };

    setUser(userInfo);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userInfo));
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Clear client state even if backend logout throws
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  }, []);

  const userRole = user?.role?.toLowerCase() || "viewer";

  // Role capability checks
  const isAdmin = userRole === "admin";
  const isEngineer = userRole === "engineer" || userRole === "admin";
  const isOperator = userRole === "operator" || userRole === "engineer" || userRole === "admin";
  const isViewer = true; // All authenticated users can view

  const value = {
    user,
    isAuthenticated,
    isInitializing,
    role: userRole,
    isAdmin,
    isEngineer,
    isOperator,
    isViewer,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
