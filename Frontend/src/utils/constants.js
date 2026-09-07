export const SENSOR_UNITS = {
  temperature: "°C",
  humidity: "% RH",
  pressure: "hPa",
};

export const SENSOR_LABELS = {
  temperature: "Temperature",
  humidity: "Humidity",
  pressure: "Pressure",
};

export const SENSOR_RANGES = {
  temperature: { min: -10, max: 60, normalMin: 15, normalMax: 40, unit: "°C", color: "#38bdf8" },
  humidity: { min: 0, max: 100, normalMin: 20, normalMax: 85, unit: "%", color: "#34d399" },
  pressure: { min: 900, max: 1100, normalMin: 980, normalMax: 1040, unit: "hPa", color: "#a78bfa" },
};

export const ACTIVE_STATION_IDS = ["AWS_01", "AWS_02", "AWS_03"];

export const KNOWN_STATIONS = {
  AWS_01: { name: "Station Alpha (Delhi NCR Hub)", city: "Delhi", location: "Delhi NCR Observational Hub", elevation: "216m" },
  AWS_02: { name: "Station Beta (Mumbai Radar)", city: "Mumbai", location: "Mumbai Coastal Radar Node", elevation: "14m" },
  AWS_03: { name: "Station Gamma (Bengaluru Craton)", city: "Bengaluru", location: "Bengaluru Cratonic Observatory", elevation: "920m" },
};

export const KNOWN_CITIES = ["Delhi", "Mumbai", "Bengaluru"];

export function getStationCity(readingOrId) {
  if (!readingOrId) return "Other";
  const stationId = typeof readingOrId === "string" ? readingOrId : readingOrId?.stationId;
  const directCity = typeof readingOrId === "object" ? (readingOrId?.city || readingOrId?.location) : null;
  if (directCity && !directCity.includes("Node") && !directCity.includes("Station") && !directCity.includes("Hub")) {
    return directCity;
  }
  if (stationId && KNOWN_STATIONS[stationId]?.city) {
    return KNOWN_STATIONS[stationId].city;
  }
  if (stationId?.startsWith("DEL") || stationId === "AWS_01") return "Delhi";
  if (stationId?.startsWith("MUM") || stationId === "AWS_02") return "Mumbai";
  if (stationId?.startsWith("BLR") || stationId === "AWS_03") return "Bengaluru";
  return "Other";
}

export const SEVERITY_CONFIG = {
  low: { label: "Low", color: "badge-severity-low", hex: "#38bdf8" },
  medium: { label: "Medium", color: "badge-severity-medium", hex: "#f59e0b" },
  high: { label: "High", color: "badge-severity-high", hex: "#f97316" },
  critical: { label: "Critical", color: "badge-severity-critical", hex: "#ef4444" },
};

export const ANOMALY_STATUS_CONFIG = {
  pending: { label: "Pending", color: "badge-pending" },
  acknowledged: { label: "Acknowledged", color: "badge-acknowledged" },
  resolved: { label: "Resolved", color: "badge-resolved" },
};

export const ANOMALY_STATUS_TRANSITIONS = {
  pending: ["acknowledged", "resolved"],
  acknowledged: ["resolved"],
  resolved: [],
};

export const ML_STATUS_CONFIG = {
  pending: { label: "Pending ML", color: "badge-pending" },
  processed: { label: "Processed", color: "badge-resolved" },
};

export const READING_ANOMALY_STATUS = {
  none: { label: "Normal", color: "status-normal" },
  detected: { label: "Anomaly Detected", color: "status-anomaly" },
  saved: { label: "Anomaly Saved", color: "status-anomaly" },
};

export const HEALTH_STATUS = {
  healthy: { label: "System Operational", color: "health-ok" },
  unhealthy: { label: "Degraded", color: "health-error" },
};

export const SERVICE_LABELS = {
  mongodb: "MongoDB Primary Store",
  mqtt: "MQTT Telemetry Broker",
  ml: "AI Anomaly Prediction Engine",
};

export const PAGE_SIZE = 20;
