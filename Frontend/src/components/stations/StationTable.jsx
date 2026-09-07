import { Link } from "react-router-dom";
import { TableSkeleton } from "../common/LoadingState";
import { EmptyTableRow } from "../common/EmptyState";
import { formatSensorValue, formatRelativeTime } from "../../utils/formatters";

function AnomalyIndicator({ status }) {
  if (!status || status === "none")
    return <span className="status-dot dot-green" title="Normal" />;
  return <span className="status-dot dot-red" title="Anomaly detected" />;
}

export function StationTable({ readings, loading, error }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Station ID</th>
            <th>Temperature</th>
            <th>Humidity</th>
            <th>Pressure</th>
            <th>Last Reading</th>
            <th>Anomaly</th>
            <th aria-label="Link" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : !readings || readings.length === 0 ? (
            <EmptyTableRow cols={7} message="No stations reporting data." />
          ) : (
            readings.map((r) => (
              <tr key={r._id || r.stationId}>
                <td>
                  <span className="td-station-id">{r.stationId}</span>
                </td>
                <td className="td-mono">{formatSensorValue("temperature", r.temperature)}</td>
                <td className="td-mono">{formatSensorValue("humidity", r.humidity)}</td>
                <td className="td-mono">{formatSensorValue("pressure", r.pressure)}</td>
                <td className="td-time">{formatRelativeTime(r.timestamp)}</td>
                <td><AnomalyIndicator status={r.anomalyStatus} /></td>
                <td>
                  <Link
                    to={`/stations/${r.stationId}`}
                    className="btn btn-ghost btn-xs"
                    aria-label={`View station ${r.stationId}`}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
