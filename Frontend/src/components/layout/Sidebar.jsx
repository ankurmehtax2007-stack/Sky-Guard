import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Users,
  HeartPulse,
  ShieldCheck,
  MapPin,
  Server,
} from "lucide-react";
import { useHealth } from "../../hooks/useHealth";

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
      { to: "/health",   icon: HeartPulse,   label: "Sensor Health Index" },
    ],
  },
  {
    label: "Control & Operations",
    items: [
      { to: "/system", icon: Server, label: "System & Simulator" },
      { to: "/users",  icon: Users,  label: "Operators" },
    ],
  },
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
      }
    >
      <Icon size={15} strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { data } = useHealth();
  const isHealthy = data?.status === "healthy";
  const statusKnown = data !== null;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

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
      </aside>
    </>
  );
}
