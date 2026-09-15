import { Thermometer, Droplets, Gauge } from "lucide-react";
import { formatSensorValue, formatRelativeTime } from "../../utils/formatters";

const SENSOR_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  pressure: Gauge,
};

const SENSOR_COLORS = {
  temperature: "sensor-card--temp",
  humidity: "sensor-card--humidity",
  pressure: "sensor-card--pressure",
};

function getReadingState(reading) {
  if (!reading) return "unknown";
  if (reading.anomalyStatus === "detected" || reading.anomalyStatus === "saved") return "anomaly";
  return "normal";
}

export function SensorCard({ sensor, reading }) {
  const Icon = SENSOR_ICONS[sensor];
  const value = reading ? reading[sensor] : null;
  const state = getReadingState(reading);

  return (
    <div className={`sensor-card ${SENSOR_COLORS[sensor]} sensor-card--${state}`}>
      <div className="sensor-card-header">
        <span className="sensor-card-name">
          {sensor.charAt(0).toUpperCase() + sensor.slice(1)}
        </span>
        {Icon && <Icon size={16} className="sensor-card-icon" strokeWidth={1.75} />}
      </div>

      <div className="sensor-card-value">
        {value !== null && value !== undefined
          ? formatSensorValue(sensor, value)
          : <span className="sensor-card-na">N/A</span>
        }
      </div>

      <div className="sensor-card-meta">
        <span className="sensor-card-station">{reading?.stationId ?? "—"}</span>
        <span className={`sensor-card-state sensor-card-state--${state}`}>
          {state === "anomaly" ? "Anomaly" : state === "normal" ? "Normal" : "Unknown"}
        </span>
      </div>

      {reading?.timestamp && (
        <div className="sensor-card-timestamp">
          {formatRelativeTime(reading.timestamp)}
        </div>
      )}
    </div>
  );
}
