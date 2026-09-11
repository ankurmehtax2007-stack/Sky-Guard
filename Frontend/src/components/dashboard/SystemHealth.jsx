import { useHealth } from "../../hooks/useHealth";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";

export function SystemHealth() {
  const { data, loading, error } = useHealth();

  const isHealthy = data?.status === "healthy" || !error;
  const services = data?.services ?? {};

  // Standard services checklist
  const serviceList = [
    { key: "ingestion", label: "Data Ingestion", status: services.ingestion?.status || "healthy" },
    { key: "detection", label: "Anomaly Detection", status: services.detection?.status || "healthy" },
    { key: "alerts", label: "Alert Engine", status: services.alerts?.status || "healthy" },
    { key: "database", label: "Database", status: services.database?.status || "healthy" },
    { key: "api", label: "API Services", status: services.api?.status || (isHealthy ? "healthy" : "degraded") },
  ];

  const operationalCount = serviceList.filter((s) => s.status === "healthy").length;
  const uptimePct = Math.round((operationalCount / serviceList.length) * 100);

  // Donut circumference for stroke-dasharray (radius 46 -> circumference 289)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * uptimePct) / 100;

  return (
    <div className="system-health-card">
      <div className="system-health-header">
        <div className="system-health-title-wrap">
          <div className="system-health-icon-box">
            <Settings size={17} className="system-health-icon" />
          </div>
          <h2 className="system-health-title">System Health</h2>
        </div>
        <span className={`system-health-badge ${isHealthy ? "system-health-badge--ok" : "system-health-badge--warn"}`}>
          {isHealthy ? "All Systems Operational" : "Service Degraded"}
        </span>
      </div>

      <div className="system-health-body">
        {/* Circular Donut Ring */}
        <div className="system-health-donut-wrap">
          <svg width="128" height="128" viewBox="0 0 128 128" className="system-health-donut-svg">
            <defs>
              <linearGradient id="healthEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Background Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="11"
              fill="none"
            />
            {/* Progress Stroke */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="url(#healthEmeraldGrad)"
              strokeWidth="11"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              filter="url(#emeraldGlow)"
            />
          </svg>
          <div className="system-health-donut-center">
            <span className="system-health-donut-pct">{uptimePct}%</span>
            <span className="system-health-donut-label">Uptime</span>
          </div>
        </div>

        {/* Services Checklist */}
        <div className="system-health-services-list">
          {serviceList.map((srv) => {
            const ok = srv.status === "healthy";
            return (
              <div key={srv.key} className="system-health-service-item">
                <span className={`system-service-dot ${ok ? "system-service-dot--ok" : "system-service-dot--bad"}`} />
                <span className="system-service-name">{srv.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
