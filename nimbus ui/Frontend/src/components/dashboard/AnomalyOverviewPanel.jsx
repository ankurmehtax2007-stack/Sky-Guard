import { Link } from "react-router-dom";
import { useAnomalies } from "../../hooks/useAnomalies";
import { useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { SeverityBadge } from "../common/StatusBadge";
import { ErrorState } from "../common/ErrorState";
import { formatRelativeTime, formatSensorValue, getSensorLabel, formatFaultType } from "../../utils/formatters";
import { CheckCircle } from "lucide-react";

function AnomalyAlertRow({ anomaly }) {
  const isCritical = anomaly.severity === "critical";
  const value = formatSensorValue(anomaly.sensor, anomaly.value);
  const time = formatRelativeTime(anomaly.detectedAt || anomaly.timestamp);
  const hasConfidence = anomaly.confidence !== undefined && anomaly.confidence !== null;
  const faultLabel = formatFaultType(anomaly.anomalyType, anomaly.sensor, anomaly.value);

  return (
    <div className={`anomaly-alert-row${isCritical ? " anomaly-alert-row--critical" : ""}`}>
      <Link to={`/stations/${anomaly.stationId}`} className="anomaly-alert-station table-link">
        {anomaly.stationId}
      </Link>
      <div className="anomaly-alert-body">
        <span className="anomaly-alert-primary">
          {getSensorLabel(anomaly.sensor)}
          {faultLabel ? ` — ${faultLabel}` : ""}
        </span>
        <span className="anomaly-alert-secondary">
          Detected value: <strong>{value}</strong>
        </span>
      </div>
      {hasConfidence && (
        <span className="anomaly-confidence">
          {(anomaly.confidence * 100).toFixed(0)}% AI
        </span>
      )}
      <SeverityBadge severity={anomaly.severity} />
      <span className="anomaly-alert-time">{time}</span>
    </div>
  );
}

export function AnomalyOverviewPanel() {
  const { data: baseAnomalies, loading, error, refetch } = useAnomalies();

  // Merge REST + real-time WebSocket anomalies
  const allAnomalies = useRealtimeAnomalies(baseAnomalies);

  if (error) {
    return <ErrorState message={`Unable to load anomalies. ${error}`} onRetry={refetch} />;
  }

  // Only show active (pending) anomalies, most recent first
  const active = allAnomalies
    .filter((a) => a.status === "pending")
    .slice(0, 6);

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <span className="section-title-lg">Active Anomalies</span>
          {!loading && active.length > 0 && (
            <span
              className="section-count"
              style={{
                background: "var(--color-red-badge)",
                borderColor: "#fecaca",
                color: "var(--color-red-text)",
              }}
            >
              {active.length}
            </span>
          )}
        </div>
        <Link to="/anomalies" className="card-link">View all anomalies</Link>
      </div>

      {loading ? (
        <div className="anomaly-alert-panel--empty">
          <span style={{ color: "var(--color-text-muted)" }}>Loading anomaly data…</span>
        </div>
      ) : active.length === 0 ? (
        <div className="anomaly-alert-panel--empty">
          <CheckCircle size={16} style={{ color: "var(--color-green)", flexShrink: 0 }} />
          <span>No active anomalies detected. All stations operating normally.</span>
        </div>
      ) : (
        <div className="anomaly-alert-panel" role="list" aria-label="Active anomaly alerts">
          {active.map((a) => (
            <AnomalyAlertRow key={a._id} anomaly={a} />
          ))}
        </div>
      )}
    </div>
  );
}
