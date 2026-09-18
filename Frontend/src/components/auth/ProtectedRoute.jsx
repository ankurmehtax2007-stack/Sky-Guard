import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isInitializing, role } = useAuth();
  const location = useLocation();
  if (isInitializing) return <div className="auth-loading-screen"><div className="spin auth-loading-spinner" /><span>Authenticating…</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Redirecting an unauthorized visitor to /dashboard causes an endless
  // /dashboard -> /dashboard navigation loop when that route has the same
  // role requirement, which appears as a blank screen.
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname, accessDenied: true }} />;
  }
  return children;
}
