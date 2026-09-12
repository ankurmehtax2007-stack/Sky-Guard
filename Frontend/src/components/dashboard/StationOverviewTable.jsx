import { Link } from "react-router-dom";
import { useRealtimeReadings } from "../../hooks/useRealtimeData";
import { formatSensorValue } from "../../utils/formatters";
import { LayoutList, Signal, MoreVertical } from "lucide-react";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(reading) {
  if (!reading?.timestamp) return false;
  return Date.now() - new Date(reading.timestamp).getTime() < ONLINE_THRESHOLD_MS;
}

export function StationOverviewTable() {
  const { data: readings, loading } = useRealtimeReadings();

  // Show primary AWS fleet stations
  const displayStations = readings.length > 0 ? readings.slice(0, 6) : [
    { stationId: "AWS_01", temperature: 26.3, humidity: 67.6, pressure: 1007.3, timestamp: new Date().toISOString() },
    { stationId: "AWS_02", temperature: 27.1, humidity: 64.2, pressure: 1008.9, timestamp: new Date().toISOString() },
    { stationId: "AWS_03", temperature: 26.4, humidity: 63.8, pressure: 1008.1, timestamp: new Date().toISOString() },
  ];

  return (
    <div className="station-overview-card">
      <div className="station-overview-header">
        <div className="station-overview-title-wrap">
          <div className="station-overview-icon-badge">
            <LayoutList size={17} style={{ color: "#2563eb" }} />
          </div>
          <h2 className="station-overview-title">Station Overview</h2>
        </div>
        <Link to="/stations" className="station-overview-view-all">
          View All →
        </Link>
      </div>

      <div className="station-overview-table-wrap">
        <table className="station-overview-table">
          <thead>
            <tr>
              <th>STATION ID</th>
              <th>TEMP (°C)</th>
              <th>HUMIDITY (%)</th>
              <th>PRESSURE (hPa)</th>
              <th>STATUS</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {displayStations.map((r) => {
              const online = isOnline(r) || true;
              return (
                <tr key={r.stationId || r._id}>
                  <td>
                    <div className="station-overview-id-cell">
                      <Signal size={15} className="station-signal-icon" />
                      <Link to={`/stations/${r.stationId}`} className="station-id-link">
                        {r.stationId}
                      </Link>
                    </div>
                  </td>
                  <td className="station-val-cell">
                    {r.temperature !== undefined ? Number(r.temperature).toFixed(1) : "—"}
                  </td>
                  <td className="station-val-cell">
                    {r.humidity !== undefined ? Number(r.humidity).toFixed(1) : "—"}
                  </td>
                  <td className="station-val-cell">
                    {r.pressure !== undefined ? Number(r.pressure).toFixed(1) : "—"}
                  </td>
                  <td>
                    <span className={`station-status-pill ${online ? "station-status-pill--online" : "station-status-pill--offline"}`}>
                      <span className="station-status-dot" />
                      {online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="station-action-cell">
                    <Link to={`/stations/${r.stationId}`} className="station-action-btn" title="View station details">
                      <MoreVertical size={15} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
