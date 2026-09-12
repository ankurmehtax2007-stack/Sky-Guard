import { Link } from "react-router-dom";
import { AnomalyBadge } from "./AnomalyBadge";
import { AnomalyStatusBadge } from "../common/StatusBadge";
import { TableSkeleton } from "../common/LoadingState";
import { EmptyTableRow } from "../common/EmptyState";
import { formatDate, getSensorLabel, formatSensorValue, formatFaultType } from "../../utils/formatters";
import { ExternalLink, Thermometer, Droplets, Gauge } from "lucide-react";

function SensorIcon({ sensor }) {
  if (sensor === "temperature") return <Thermometer size={13} style={{ color: "#38bdf8", marginRight: 4 }} />;
  if (sensor === "humidity") return <Droplets size={13} style={{ color: "#34d399", marginRight: 4 }} />;
  return <Gauge size={13} style={{ color: "#a78bfa", marginRight: 4 }} />;
}

export function AnomalyTable({ anomalies, loading, onViewDetail }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Station</th>
            <th>Sensor</th>
            <th>Detected Value</th>
            <th>Fault Type</th>
            <th>Severity</th>
            <th>AI Confidence</th>
            <th>Detected Time</th>
            <th>Status</th>
            <th aria-label="Actions">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton rows={8} cols={9} />
          ) : anomalies.length === 0 ? (
            <EmptyTableRow cols={9} message="No anomalies match the current filters." />
          ) : (
            anomalies.map((a) => {
              const conf = a.confidence !== undefined ? Math.round(Number(a.confidence) * 100) : null;
              return (
                <tr key={a._id}>
                  <td>
                    <Link to={`/stations/${a.stationId}`} className="table-link td-station-id">
                      {a.stationId}
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <SensorIcon sensor={a.sensor} />
                      <span>{getSensorLabel(a.sensor)}</span>
                    </div>
                  </td>
                  <td className="td-mono" style={{ color: "var(--color-red)", fontWeight: 600 }}>
                    {formatSensorValue(a.sensor, a.value)}
                  </td>
                  <td className="td-type" style={{ fontWeight: 500 }}>
                    {formatFaultType(a.anomalyType, a.sensor, a.value)}
                  </td>
                  <td><AnomalyBadge severity={a.severity} /></td>
                  <td>
                    {conf !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="td-mono">{conf}%</span>
                        <div style={{ width: 45, height: 4, background: "rgba(148, 163, 184, 0.15)", borderRadius: 3, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${conf}%`,
                              background: conf > 90 ? "var(--color-green)" : "var(--color-accent)",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="td-time">{formatDate(a.detectedAt || a.timestamp)}</td>
                  <td><AnomalyStatusBadge status={a.status} /></td>
                  <td>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => onViewDetail(a._id)}
                      title="Investigate anomaly detail & SOP"
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <span>Diagnose</span>
                      <ExternalLink size={11} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
