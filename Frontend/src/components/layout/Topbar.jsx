import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Volume2, VolumeX, Clock, LogOut, Shield } from "lucide-react";
import { useHealth } from "../../hooks/useHealth";
import { useWsStatus } from "../../context/WebSocketContext";
import { useAuth } from "../../context/AuthContext";

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case "admin":
      return { bg: "rgba(239, 68, 68, 0.18)", text: "#f87171", border: "rgba(239, 68, 68, 0.35)" };
    case "engineer":
      return { bg: "rgba(168, 85, 247, 0.18)", text: "#c084fc", border: "rgba(168, 85, 247, 0.35)" };
    case "operator":
      return { bg: "rgba(14, 165, 233, 0.18)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.35)" };
    case "viewer":
    default:
      return { bg: "rgba(16, 185, 129, 0.18)", text: "#34d399", border: "rgba(16, 185, 129, 0.35)" };
  }
};

export function Topbar({ pageTitle, onMenuToggle }) {
  const { data, loading } = useHealth();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const isDashboard = location.pathname === "/dashboard";
  const isHealthy = data?.status === "healthy";
  const wsStatus = useWsStatus();

  // User menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Clock state
  const [timeStr, setTimeStr] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("skyguard_audio_alert") === "true";
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-IN", { hour12: false });
      setTimeStr(time);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("skyguard_audio_alert", next ? "true" : "false");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const roleStyle = getRoleBadgeStyle(role);
  const initial = (user?.username?.[0] || "U").toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation"
          id="topbar-menu-toggle"
        >
          <Menu size={18} />
        </button>

        {isDashboard ? (
          <div className="topbar-dashboard-title">
            <span className="topbar-dashboard-name">SkyGuard AI</span>
            <span className="topbar-dashboard-desc">
              Smart India Hackathon • AWS Meteorological Defense &amp; Anomaly Detection
            </span>
          </div>
        ) : (
          <h1 className="topbar-title">{pageTitle}</h1>
        )}
      </div>

      <div className="topbar-right">
        {/* Live Clock */}
        <div className="topbar-clock" title="System Local Clock">
          <Clock size={12} style={{ color: "var(--color-accent)" }} />
          <span>{timeStr || "00:00:00"} IST</span>
        </div>

        {/* Audio Alert Toggle */}
        <button
          onClick={toggleSound}
          className={`topbar-audio-btn ${soundEnabled ? "topbar-audio-btn--active" : ""}`}
          title={soundEnabled ? "Audio siren enabled for critical anomalies" : "Click to enable audio alerts"}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>{soundEnabled ? "Alarm On" : "Muted"}</span>
        </button>

        {/* WebSocket real-time status */}
        <div
          className="topbar-health"
          title={`WebSocket Stream: ${wsStatus}`}
          style={{ gap: "6px" }}
        >
          <span
            className={`live-dot ${
              wsStatus === "connected"
                ? "live-dot--pulse"
                : wsStatus === "disconnected"
                ? "live-dot--red"
                : "live-dot--gray"
            }`}
          />
          <span className="topbar-health-label">
            {wsStatus === "connected"
              ? "Live Telemetry"
              : wsStatus === "disconnected"
              ? "WS Offline"
              : "Connecting…"}
          </span>
        </div>

        {/* Backend system health */}
        <div className="topbar-health">
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: loading
                ? "var(--color-text-muted)"
                : isHealthy
                ? "var(--color-green)"
                : "var(--color-red)",
              flexShrink: 0,
            }}
          />
          <span className="topbar-health-label">
            {loading ? "Probing…" : isHealthy ? "Services OK" : "Degraded"}
          </span>
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "3px 8px 3px 4px",
                borderRadius: "20px",
                border: `1px solid ${menuOpen ? "var(--color-accent)" : "var(--color-border)"}`,
                background: "rgba(13, 19, 34, 0.9)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              aria-label="User profile menu"
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: roleStyle.bg,
                  border: `1px solid ${roleStyle.border}`,
                  color: roleStyle.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {initial}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  maxWidth: "90px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.username}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: roleStyle.bg,
                  color: roleStyle.text,
                  border: `1px solid ${roleStyle.border}`,
                  letterSpacing: "0.3px",
                }}
              >
                {role}
              </span>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  width: "200px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--color-border-light)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", wordBreak: "break-all" }}>
                    {user.email}
                  </div>
                  <div style={{ marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Shield size={10} color={roleStyle.text} />
                    <span style={{ fontSize: "10px", color: roleStyle.text, textTransform: "capitalize", fontWeight: 600 }}>
                      {role} Access
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    color: "var(--color-red-text)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
