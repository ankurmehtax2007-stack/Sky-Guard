import { Link } from "react-router-dom";
import { useAnomalies } from "../../hooks/useAnomalies";
import { useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { SeverityBadge, AnomalyStatusBadge } from "../common/StatusBadge";
import { TableSkeleton } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyTableRow } from "../common/EmptyState";
import { formatRelativeTime, getSensorLabel, formatSensorValue, formatFaultType } from "../../utils/formatters";

export function RecentAnomalies() {
  const { data: baseAnomalies, loading, error, refetch } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);
  const recent = anomalies.slice(0, 8);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Recent Anomalies</h2>
        <Link to="/anomalies" className="card-link">View all</Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Sensor</th>
                <th>Value</th>
                <th>Severity</th>
                <th>Type</th>
                <th>Detected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : recent.length === 0 ? (
                <EmptyTableRow cols={7} message="No anomalies detected." />
              ) : (
                recent.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <Link to={`/stations/${a.stationId}`} className="table-link">
                        {a.stationId}
                      </Link>
                    </td>
                    <td>{getSensorLabel(a.sensor)}</td>
                    <td className="td-mono">{formatSensorValue(a.sensor, a.value)}</td>
                    <td><SeverityBadge severity={a.severity} /></td>
                    <td className="td-type">{formatFaultType(a.anomalyType, a.sensor, a.value)}</td>
                    <td className="td-time">{formatRelativeTime(a.detectedAt || a.timestamp)}</td>
                    <td><AnomalyStatusBadge status={a.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
