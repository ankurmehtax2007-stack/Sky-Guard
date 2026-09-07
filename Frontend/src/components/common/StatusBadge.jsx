import { SEVERITY_CONFIG, ANOMALY_STATUS_CONFIG } from "../../utils/constants";

export function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity];
  if (!config) return null;
  return <span className={`badge ${config.color}`}>{config.label}</span>;
}

export function AnomalyStatusBadge({ status }) {
  const config = ANOMALY_STATUS_CONFIG[status];
  if (!config) return <span className="badge badge-pending">{status}</span>;
  return <span className={`badge ${config.color}`}>{config.label}</span>;
}

export function ServiceStatusDot({ status, label }) {
  const isUp = status === "up";
  return (
    <span className="service-status-item">
      <span className={`status-dot ${isUp ? "dot-green" : "dot-red"}`} />
      <span className="service-status-label">{label}</span>
    </span>
  );
}
