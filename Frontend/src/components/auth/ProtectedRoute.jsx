import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function ProtectedRoute({ children, requireAdmin = false, allowedRoles = null }) {
  const { isAuthenticated, isInitializing, user, role, isAdmin } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070a12",
          color: "#38bdf8",
          gap: "16px",
        }}
      >
        <div
          className="spin"
          style={{
            width: 32,
            height: 32,
            border: "2.5px solid rgba(56,189,248,0.2)",
            borderTopColor: "#38bdf8",
            borderRadius: "50%",
          }}
        />
        <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          Authenticating security session…
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin role check
  if (requireAdmin && !isAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070a12",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", marginBottom: "8px" }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
            Operator account <strong>{user?.username}</strong> ({role}) does not have administrative privileges for this section.
          </p>
          <Link
            to="/dashboard"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <ArrowLeft size={16} />
            <span>Return to Mission Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Generic allowed roles check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070a12",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f59e0b",
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", marginBottom: "8px" }}>
            Insufficient Permissions
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
            Your role (<strong>{role}</strong>) does not have access to this operational module.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
