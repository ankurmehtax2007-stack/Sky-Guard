import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Users,
  HeartPulse,
  ShieldCheck,
  MapPin,
  Server,
  Plus,
  LogOut
} from "lucide-react";
import { useHealth } from "../../hooks/useHealth";
import { useAuth } from "../../context/AuthContext";

const ALL_ITEMS = {
  admin: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Admin Dashboard" },
    { to: "/stations", icon: Radio, label: "Live Monitoring" },
    { to: "/map", icon: MapPin, label: "India Radar Fleet" },
    { to: "/anomalies", icon: AlertTriangle, label: "Anomaly Incidents" },
    { to: "/health", icon: HeartPulse, label: "Sensor Health Index" },
    { to: "/system", icon: Server, label: "System & Simulator" },
    { to: "/users", icon: Users, label: "User Management" },
  ],
  engineer: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Engineer Dashboard" },
    { to: "/stations", icon: Radio, label: "City Monitoring" },
    { to: "/anomalies", icon: AlertTriangle, label: "Anomaly Response" },
    { to: "/health", icon: HeartPulse, label: "Sensor Health" },
  ],
  operator: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Operator Dashboard" },
    { to: "/stations", icon: Radio, label: "Live Monitoring" },
    { to: "/anomalies", icon: AlertTriangle, label: "Incident Response" },
    { to: "/health", icon: HeartPulse, label: "Sensor Health" },
  ]
};

export function Sidebar({ isOpen, onClose }) {
  const { data } = useHealth();
  const { role = "operator", user, logout } = useAuth();
  const navigate = useNavigate();
  const isHealthy = data?.status === "healthy";
  const statusKnown = data !== null;
  const items = ALL_ITEMS[role] || ALL_ITEMS.operator;
  const city = user?.stationId || null;

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <ShieldCheck size={18} strokeWidth={1.75} className="sidebar-logo-icon" />
          <div className="sidebar-wordmark"><span className="sidebar-brand">NIMbus</span><span className="sidebar-brand-sub">AI</span></div>
        </div>

        <div className="sidebar-role-card">
          <span className={`sidebar-role-dot sidebar-role-dot--${role}`} />
          <div><strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>{city && role !== "admin" && <small>{city} scope</small>}</div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`}>
              <item.icon size={15} strokeWidth={1.75} /><span>{item.label}</span>
              {role === "admin" && item.to === "/users" && (
                <button
                  type="button"
                  className="sidebar-add-user-btn"
                  title="Add user"
                  aria-label="Add user"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose?.();
                    navigate("/users?create=1");
                  }}
                >
                  <Plus size={13} />
                </button>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={async () => {
              onClose?.();
              await logout();
              navigate("/login", { replace: true });
            }}
            title="Sign out of account"
            aria-label="Sign out"
            id="sidebar-logout-btn"
          >
            <LogOut size={14} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>

        <div className="sidebar-system-status">
          <span className={`sidebar-status-dot ${statusKnown && !isHealthy ? "sidebar-status-dot--degraded" : ""}`} />
          <span>{!statusKnown ? "Checking system…" : isHealthy ? "All systems operational" : "Service degraded"}</span>
        </div>
      </aside>
    </>
  );
}
