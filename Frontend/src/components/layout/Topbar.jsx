import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Volume2, VolumeX, Clock } from "lucide-react";
import { useHealth } from "../../hooks/useHealth";
import { useWsStatus } from "../../context/WebSocketContext";

export function Topbar({ pageTitle, onMenuToggle }) {
  const { data, loading } = useHealth();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const isHealthy = data?.status === "healthy";
  const wsStatus = useWsStatus();

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

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("skyguard_audio_alert", next ? "true" : "false");
  };

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
          <span>Notification</span>
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
      </div>
    </header>
  );
}
