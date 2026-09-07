import { Link } from "react-router-dom";
import { useLatestReadings } from "../../hooks/useReadings";
import { TableSkeleton } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyTableRow } from "../common/EmptyState";
import { formatSensorValue, formatRelativeTime } from "../../utils/formatters";

function AnomalyIndicator({ status }) {
  if (!status || status === "none") return <span className="status-dot dot-green" title="Normal" />;
  return <span className="status-dot dot-red" title="Anomaly" />;
}

export function StationStatus() {
  const { data: readings, loading, error, refetch } = useLatestReadings();

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Station Status</h2>
        <Link to="/stations" className="card-link">Manage stations</Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Station ID</th>
                <th>Temp</th>
                <th>Humidity</th>
                <th>Pressure</th>
                <th>Last Reading</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : !readings || readings.length === 0 ? (
                <EmptyTableRow cols={6} message="No stations reporting." />
              ) : (
                readings.map((r) => (
                  <tr key={r._id || r.stationId}>
                    <td>
                      <Link to={`/stations/${r.stationId}`} className="table-link">
                        {r.stationId}
                      </Link>
                    </td>
                    <td className="td-mono">{formatSensorValue("temperature", r.temperature)}</td>
                    <td className="td-mono">{formatSensorValue("humidity", r.humidity)}</td>
                    <td className="td-mono">{formatSensorValue("pressure", r.pressure)}</td>
                    <td className="td-time">{formatRelativeTime(r.timestamp)}</td>
                    <td>
                      <AnomalyIndicator status={r.anomalyStatus} />
                    </td>
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
