import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Users,
  HeartPulse,
  ShieldCheck,
  MapPin,
  BrainCircuit,
  Server,
  LogOut,
  Shield,
} from "lucide-react";
import { useHealth } from "../../hooks/useHealth";
import { useAuth } from "../../context/AuthContext";

const NAV_SECTIONS = [
  {
    label: null, // top-level
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Overview Dashboard" },
    ],
  },
  {
    label: "Telemetry & Geospatial",
    items: [
      { to: "/stations",  icon: Radio,          label: "Live Monitoring"  },
      { to: "/map",       icon: MapPin,         label: "India Radar Fleet" },
      { to: "/anomalies", icon: AlertTriangle,   label: "Anomaly Incidents" },
    ],
  },
  {
    label: "Intelligence & Analysis",
    items: [
      { to: "/insights", icon: BrainCircuit, label: "XAI & LLM Insights" },
      { to: "/health",   icon: HeartPulse,   label: "Sensor Health Index" },
    ],
  },
  {
    label: "Control & Operations",
    items: [
      { to: "/system", icon: Server, label: "System & Simulator" },
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

function NavItem({ to, icon: Icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
      }
    >
      <Icon size={15} strokeWidth={1.75} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            padding: "1px 5px",
            borderRadius: "4px",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { data } = useHealth();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const isHealthy = data?.status === "healthy";
  const statusKnown = data !== null;

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
        {/* Brand */}
        <div className="sidebar-header">
          <ShieldCheck size={18} strokeWidth={1.75} className="sidebar-logo-icon" />
          <div className="sidebar-wordmark">
            <span className="sidebar-brand">SkyGuard</span>
            <span className="sidebar-brand-sub">AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className="sidebar-nav-section"
              style={section.label === null ? { paddingBottom: 0 } : undefined}
            >
              {section.label && (
                <span className="sidebar-nav-label">{section.label}</span>
              )}
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} onClick={handleNavClick} />
              ))}
            </div>
          ))}
        </nav>

        {/* User Account & System status footer */}
        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--color-border-light)" }}>
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid var(--color-border-light)",
                background: "rgba(0, 0, 0, 0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: roleStyle.bg,
                    border: `1px solid ${roleStyle.border}`,
                    color: roleStyle.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text)",
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
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  padding: "6px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                title="Sign out"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-red-text)";
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* System status footer */}
          <div className="sidebar-system-status">
            <span
              className={`sidebar-status-dot ${
                statusKnown && !isHealthy ? "sidebar-status-dot--degraded" : ""
              }`}
            />
            <span>
              {!statusKnown
                ? "Checking system…"
                : isHealthy
                ? "All systems operational"
                : "Service degraded"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
