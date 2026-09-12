import { Link } from "react-router-dom";
import { useAnomalies } from "../../hooks/useAnomalies";
import { useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { SeverityBadge } from "../common/StatusBadge";
import { ErrorState } from "../common/ErrorState";
import { formatRelativeTime, formatSensorValue, getSensorLabel, formatFaultType } from "../../utils/formatters";
import { AlertTriangle, CheckCircle } from "lucide-react";

function AnomalyAlertRow({ anomaly }) {
  const isCritical = anomaly.severity === "critical";
  const value = formatSensorValue(anomaly.sensor, anomaly.value);
  const time = formatRelativeTime(anomaly.detectedAt || anomaly.timestamp);
  const hasConfidence = anomaly.confidence !== undefined && anomaly.confidence !== null;
  const faultLabel = formatFaultType(anomaly.anomalyType, anomaly.sensor, anomaly.value);

  return (
    <div className={`active-anomaly-row ${isCritical ? "active-anomaly-row--critical" : ""}`}>
      <div className="active-anomaly-station-cell">
        <Link to={`/stations/${anomaly.stationId}`} className="active-anomaly-station-link">
          {anomaly.stationId}
        </Link>
      </div>
      <div className="active-anomaly-info-cell">
        <span className="active-anomaly-title">
          {getSensorLabel(anomaly.sensor)}
          {faultLabel ? ` — ${faultLabel}` : ""}
        </span>
        <span className="active-anomaly-detected">
          Detected value: <strong>{value}</strong>
        </span>
      </div>
      {hasConfidence && (
        <span className="active-anomaly-ai-badge">
          {(anomaly.confidence * 100).toFixed(0)}% AI
        </span>
      )}
      <SeverityBadge severity={anomaly.severity} />
      <span className="active-anomaly-time-cell">{time}</span>
    </div>
  );
}

export function AnomalyOverviewPanel() {
  const { data: baseAnomalies, loading, error, refetch } = useAnomalies();
  const allAnomalies = useRealtimeAnomalies(baseAnomalies);

  if (error) {
    return <ErrorState message={`Unable to load anomalies. ${error}`} onRetry={refetch} />;
  }

  // Active (pending) anomalies, most recent first
  const active = allAnomalies
    .filter((a) => a.status === "pending")
    .slice(0, 6);

  return (
    <div className="active-anomalies-card">
      <div className="active-anomalies-header">
        <div className="active-anomalies-title-wrap">
          <div className="active-anomalies-icon-badge">
            <AlertTriangle size={18} style={{ color: "#ef4444" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 className="active-anomalies-title">Active Anomalies Live Incidents</h2>
              {!loading && active.length > 0 && (
                <span className="active-anomalies-count-badge">
                  {active.length} Active
                </span>
              )}
            </div>
            <p className="active-anomalies-subtitle">
              Live automated alerts detected across fleet sensors requiring operational triage
            </p>
          </div>
        </div>
        <Link to="/anomalies" className="active-anomalies-view-all">
          View All Anomalies →
        </Link>
      </div>

      {loading ? (
        <div className="active-anomalies-empty">
          <span>Loading anomaly telemetry…</span>
        </div>
      ) : active.length === 0 ? (
        <div className="active-anomalies-empty">
          <CheckCircle size={17} style={{ color: "#16a34a", flexShrink: 0 }} />
          <span>No active anomalies detected. All fleet sensor nodes are operating within normal nominal ranges.</span>
        </div>
      ) : (
        <div className="active-anomalies-list" role="list" aria-label="Active anomaly alerts">
          {active.map((a) => (
            <AnomalyAlertRow key={a._id} anomaly={a} />
          ))}
        </div>
      )}
    </div>
  );
}
