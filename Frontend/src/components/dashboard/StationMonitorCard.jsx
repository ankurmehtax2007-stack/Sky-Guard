import { Link } from "react-router-dom";
import { formatRelativeTime } from "../../utils/formatters";
import { KNOWN_STATIONS, SENSOR_RANGES } from "../../utils/constants";
import { AlertCircle, Thermometer, Droplets, Gauge } from "lucide-react";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function getStationStatus(reading) {
  if (!reading?.timestamp) return "offline";
  const age = Date.now() - new Date(reading.timestamp).getTime();
  if (age > ONLINE_THRESHOLD_MS) return "offline";
  if (reading.anomalyStatus === "detected" || reading.anomalyStatus === "saved") return "anomaly";
  return "normal";
}

function GaugeCell({ label, sensor, value, icon: Icon, color, min, max, unit }) {
  const hasValue = value !== null && value !== undefined && typeof value === "number";
  const pct = hasValue ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  return (
    <div className="station-reading-cell">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="station-reading-label">{label}</span>
        <Icon size={12} style={{ color }} />
      </div>

      <div style={{ margin: "3px 0" }}>
        {hasValue ? (
          <span className="station-reading-value">
            {Number(value).toFixed(1)}
            <span className="station-reading-unit"> {unit}</span>
          </span>
        ) : (
          <span className="station-reading-value" style={{ color: "var(--color-text-muted)" }}>—</span>
        )}
      </div>

      <div className="gauge-bar-track">
        <div
          className="gauge-bar-fill"
          style={{
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export function StationMonitorCard({ reading }) {
  const status = getStationStatus(reading);
  const isOnline = status !== "offline";
  const isAnomaly = status === "anomaly";
  const meta = KNOWN_STATIONS[reading.stationId] || { name: "Automatic Weather Station", location: "Active Node" };

  return (
    <Link
      to={`/stations/${reading.stationId}`}
      style={{ display: "block", textDecoration: "none" }}
      aria-label={`View station ${reading.stationId} details`}
    >
      <div className={`station-card-upgraded station-monitor-card--${status}`}>
        {/* Anomaly banner if active */}
        {isAnomaly && (
          <div className="station-alert-ribbon">
            <AlertCircle size={12} />
            <span>Telemetry Anomaly Detected</span>
          </div>
        )}

        {/* Header */}
        <div className="station-card-header">
          <div>
            <span className="station-card-id">{reading.stationId}</span>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
              {meta.location}
            </div>
          </div>
          <div className="station-card-meta">
            <span className={`live-dot ${isOnline ? "live-dot--pulse" : "live-dot--gray"}`} />
            <span className={`station-card-online-label station-card-online-label--${isOnline ? "online" : "offline"}`}>
              {isOnline ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        {/* Sensor Readings with Gauge Visualizers */}
        <div className="station-card-readings">
          <GaugeCell
            label="Temp"
            sensor="temperature"
            value={reading.temperature}
            icon={Thermometer}
            color="#38bdf8"
            min={SENSOR_RANGES.temperature.min}
            max={SENSOR_RANGES.temperature.max}
            unit="°C"
          />
          <GaugeCell
            label="Humidity"
            sensor="humidity"
            value={reading.humidity}
            icon={Droplets}
            color="#34d399"
            min={SENSOR_RANGES.humidity.min}
            max={SENSOR_RANGES.humidity.max}
            unit="%"
          />
          <GaugeCell
            label="Pressure"
            sensor="pressure"
            value={reading.pressure}
            icon={Gauge}
            color="#a78bfa"
            min={SENSOR_RANGES.pressure.min}
            max={SENSOR_RANGES.pressure.max}
            unit="hPa"
          />
        </div>

        {/* Footer */}
        <div className="station-card-footer">
          <span className="station-card-timestamp">
            {reading.timestamp ? `Updated: ${formatRelativeTime(reading.timestamp)}` : "No data"}
          </span>
          <span className={`station-status-badge station-status-badge--${status}`}>
            {status === "normal" ? "Normal" : status === "anomaly" ? "Fault Detected" : "Offline"}
          </span>
        </div>
      </div>
    </Link>
  );
}
