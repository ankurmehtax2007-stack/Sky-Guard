import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Eye, EyeOff, UserPlus, LogIn, UserCheck } from "lucide-react";
import { parseApiError } from "../utils/formatters";

const ROLES = [
  { value: "viewer", label: "Viewer", desc: "Read-only access to live data & maps" },
  { value: "operator", label: "Operator", desc: "Telemetry monitoring & alert triage" },
  { value: "engineer", label: "Engineer", desc: "Diagnostic simulation & model tuning" },
  { value: "admin", label: "Admin", desc: "Full administrative & user control" },
];

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRoleSelect = (roleValue) => {
    setForm((f) => ({ ...f, role: roleValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === "login") {
      if (!form.email || !form.password) {
        setError("Please enter your email and password.");
        return;
      }
      setLoading(true);
      try {
        await login({ email: form.email, password: form.password });
        const destination = location.state?.from?.pathname || "/dashboard";
        navigate(destination, { replace: true });
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    } else {
      // Registration
      if (!form.username || !form.email || !form.password) {
        setError("Please fill out all required fields.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      setLoading(true);
      try {
        await register({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        const destination = location.state?.from?.pathname || "/dashboard";
        navigate(destination, { replace: true });
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
  };

  // Quick fill helper for testing different roles during demo
  const quickFill = (demoRole) => {
    setMode("register");
    setForm({
      username: `${demoRole}_pilot`,
      email: `${demoRole}@skyguard.ai`,
      password: "password123",
      role: demoRole,
    });
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-panel" style={{ maxWidth: mode === "register" ? "440px" : "390px" }}>
        {/* Brand */}
        <div className="login-brand">
          <ShieldCheck size={32} strokeWidth={1.5} className="login-brand-icon" />
          <div>
            <h1 className="login-title">SkyGuard AI</h1>
            <p className="login-subtitle">Intelligent Weather Station Monitoring</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            background: "rgba(15, 23, 42, 0.8)",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: mode === "login" ? "var(--color-accent)" : "transparent",
              color: mode === "login" ? "#ffffff" : "var(--color-text-secondary)",
            }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: mode === "register" ? "var(--color-accent)" : "transparent",
              color: mode === "register" ? "#ffffff" : "var(--color-text-secondary)",
            }}
          >
            <UserPlus size={14} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                Username <span style={{ color: "var(--color-red)" }}>*</span>
              </label>
              <input
                id="login-username"
                type="text"
                name="username"
                className="form-input"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. radar_operator"
                autoComplete="name"
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address <span style={{ color: "var(--color-red)" }}>*</span>
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              placeholder="you@domain.gov / user@skyguard.ai"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password <span style={{ color: "var(--color-red)" }}>*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-input"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">
                Operational Role <span style={{ color: "var(--color-red)" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {ROLES.map((r) => {
                  const isSelected = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => handleRoleSelect(r.value)}
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        background: isSelected ? "rgba(14, 165, 233, 0.15)" : "var(--color-surface-card)",
                        border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: isSelected ? "var(--color-accent-hover)" : "var(--color-text)" }}>
                          {r.label}
                        </span>
                        {isSelected && <UserCheck size={12} color="var(--color-accent-hover)" />}
                      </div>
                      <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "3px 0 0 0", lineHeight: 1.3 }}>
                        {r.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--color-green-light)",
                border: "1px solid var(--color-green-badge)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
                color: "var(--color-green-text)",
              }}
            >
              {successMessage}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "Verifying credentials…"
                : "Registering user…"
              : mode === "login"
              ? "Sign in to Mission Control"
              : "Create Authorized Account"}
          </button>
        </form>

        {/* Demo Quick-Fill Bar */}
        <div
          style={{
            paddingTop: "14px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Demo Accounts Quick-Fill
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
            {["admin", "operator", "engineer", "viewer"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => quickFill(r)}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--color-border)",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.color = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <p className="login-footer">
          Automatic Weather Station Anomaly Detection System • SIH
        </p>
      </div>
    </div>
  );
}
