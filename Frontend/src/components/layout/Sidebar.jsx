import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useHealth } from "../../hooks/useHealth";
import { useAnomalies } from "../../hooks/useAnomalies";

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
      { to: "/users",  icon: Users,  label: "Operators" },
    ],
  },
];

function NavItem({ to, icon: Icon, label, hasBadge, badgeCount, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
      }
    >
      <Icon size={18} strokeWidth={1.85} className="sidebar-nav-icon" />
      <span className="sidebar-nav-text">{label}</span>
      {hasBadge && (
        <span className="sidebar-badge">{badgeCount ?? 3}</span>
      )}
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { data: healthData } = useHealth();
  const { data: anomaliesData } = useAnomalies();

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
