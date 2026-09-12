import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Activity,
  MapPin,
  AlertTriangle,
  BrainCircuit,
  HeartPulse,
  Layers,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useHealth } from "../../hooks/useHealth";
import { useAnomalies } from "../../hooks/useAnomalies";
import { useAuth } from "../../context/AuthContext";

const NAV_SECTIONS = [
  {
    label: null, // top-level
    items: [
      { to: "/dashboard", icon: Home, label: "Overview Dashboard" },
      { to: "/stations",  icon: Activity, label: "Live Monitoring" },
      { to: "/map",       icon: MapPin, label: "India Radar Fleet" },
      { to: "/anomalies", icon: AlertTriangle, label: "Anomaly Incidents", hasBadge: true },
      { to: "/insights",  icon: BrainCircuit, label: "XAI & LLM Insights" },
      { to: "/health",    icon: HeartPulse, label: "Sensor Health Index" },
    ],
  },
  {
    label: "SYSTEM",
    isSystem: true,
    items: [
      { to: "/system", icon: Layers, label: "System & Simulator" },
      { to: "/users",  icon: Users,  label: "Operators", badge: "Admin" },
    ],
  },
];

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

function NavItem({ to, icon: Icon, label, hasBadge, badgeCount, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
      }
    >
      <Icon size={18} strokeWidth={1.85} className="sidebar-nav-icon" />
      <span className="sidebar-nav-text" style={{ flex: 1 }}>{label}</span>
      {hasBadge && (
        <span className="sidebar-badge">{badgeCount ?? 3}</span>
      )}
      {badge && !hasBadge && (
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "2px 6px",
            borderRadius: "5px",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            boxShadow: "0 0 6px rgba(239, 68, 68, 0.2)",
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { data: healthData } = useHealth();
  const { data: anomaliesData } = useAnomalies();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const isHealthy = healthData?.status === "healthy";
  const statusKnown = healthData !== null;

  // Active anomaly count (pending/critical triage incidents) or fallback to 3
  const criticalCount = anomaliesData?.filter((a) => a.status === "pending" && a.severity === "critical").length ?? 0;
  const pendingCount = anomaliesData?.filter((a) => a.status === "pending").length ?? 0;
  const rawBadgeCount = criticalCount > 0 ? criticalCount : (pendingCount > 0 ? pendingCount : 3);
  const badgeDisplay = rawBadgeCount > 99 ? "99+" : rawBadgeCount;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const roleStyle = getRoleBadgeStyle(role);
  const initial = (user?.username?.[0] || "U").toUpperCase();

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-icon-wrap">
            <svg
              width="36"
              height="36"
              viewBox="0 0 32 32"
              fill="none"
              className="sidebar-brand-cloud"
              aria-label="SkyGuard Cloud Logo"
            >
              <path
                d="M8.5 22C5.46 22 3 19.54 3 16.5C3 13.7 5.08 11.38 7.82 11.04C8.68 6.98 12.28 4 16.5 4C21.05 4 24.8 7.37 25.4 11.87C28.53 12.37 31 15.08 31 18.5C31 22.09 28.09 25 24.5 25H10"
                stroke="url(#skyBlueGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 14L12.5 20.5H17.5L13.5 27"
                stroke="#60a5fa"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="skyBlueGrad"
                  x1="3"
                  y1="4"
                  x2="31"
                  y2="25"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">
              SkyGuard <span className="sidebar-brand-ai">AI</span>
            </div>
            <div className="sidebar-brand-subtitle">
              Smarter Skies. Safer Tomorrow.
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className={`sidebar-nav-section ${
                section.isSystem ? "sidebar-nav-section--system" : ""
              }`}
            >
              {section.label && (
                <span className="sidebar-nav-label">{section.label}</span>
              )}
              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  badgeCount={item.hasBadge ? badgeDisplay : undefined}
                  onClick={handleNavClick}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User Account Bar */}
        {user && (
          <div
            style={{
              margin: "10px 14px 4px 14px",
              padding: "10px 12px",
              background: "rgba(14, 23, 48, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "12px",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: roleStyle.bg,
                  border: `1px solid ${roleStyle.border}`,
                  color: roleStyle.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${roleStyle.border}`,
                }}
              >
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#f1f5f9",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.username}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: roleStyle.text,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {role}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#94a3b8",
                padding: "6px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              title="Sign out"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f87171";
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {/* Bottom Quote Box */}
        <div className="sidebar-quote-card">
          <div className="sidebar-quote-card-text">
            &ldquo;Turning<br />Weather Data<br />into a Safer<br />Tomorrow.&rdquo;
          </div>
          <div className="sidebar-quote-card-bar" />
        </div>

        <div className="sidebar-footer-divider" />

        {/* System status footer */}
        <div className="sidebar-system-status">
          <ShieldCheck size={22} strokeWidth={1.75} className="sidebar-status-shield" />
          <div className="sidebar-status-info">
            <span className="sidebar-status-version">v1.0.0</span>
            <div className="sidebar-status-row">
              <span
                className={`sidebar-status-dot ${
                  statusKnown && !isHealthy ? "sidebar-status-dot--degraded" : ""
                }`}
              />
              <span
                className={`sidebar-status-text ${
                  statusKnown && !isHealthy ? "sidebar-status-text--degraded" : ""
                }`}
              >
                {!statusKnown
                  ? "Checking system…"
                  : isHealthy
                  ? "All Systems Operational"
                  : "Service Degraded"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
