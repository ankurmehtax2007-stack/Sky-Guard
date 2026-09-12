import { SENSOR_UNITS, SENSOR_LABELS } from "./constants";

export function formatDate(ts) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

export function formatDateShort(ts) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

export function formatRelativeTime(ts) {
  if (!ts) return "—";
  const now = Date.now();
  const diff = now - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatSensorValue(sensor, value) {
  if (value === null || value === undefined) return "—";
  const unit = SENSOR_UNITS[sensor] || "";
  return `${Number(value).toFixed(1)} ${unit}`;
}

export function getSensorLabel(sensor) {
  return SENSOR_LABELS[sensor] || sensor;
}

export function formatConfidence(confidence) {
  if (confidence === null || confidence === undefined) return "—";
  return `${(Number(confidence) * 100).toFixed(1)}%`;
}

/**
 * Format raw anomaly fault type strings (e.g. 'known_anomaly', 'temp', 'temperature_spike')
 * into human-readable physical fault classifications.
 */
export function formatFaultType(anomalyType, sensor, value) {
  const raw = String(anomalyType || "").trim().toLowerCase();

  const map = {
    temperature_spike: "Temperature Spike",
    temp_spike: "Temperature Spike",
    thermal_spike: "Temperature Spike",
    cryogenic_dip: "Cryogenic Dip",
    temp_dip: "Temperature Dip",
    humidity_spike: "Humidity Surge",
    hum_spike: "Humidity Surge",
    moisture_saturation_surge: "Moisture Saturation",
    arid_drop: "Arid Drop",
    pressure_jump: "Pressure Surge",
    press_jump: "Pressure Surge",
    barometric_surge: "Barometric Surge",
    barometric_depression: "Barometric Depression",
    freeze: "Sensor Freeze",
    sensor_freeze: "Sensor Freeze",
    drift: "Calibration Drift",
    sensor_drift: "Calibration Drift",
    offset: "Sensor Offset",
    sensor_offset: "Sensor Offset",
    spatial_inconsistency: "Spatial Inconsistency",
    spatial_divergence: "Spatial Divergence",
    multivariate_inconsistency: "Cross-Sensor Inconsistency",
    missing_data: "Missing Telemetry",
    novel_anomaly: "Novel Physical Anomaly",
  };

  if (map[raw]) {
    return map[raw];
  }

  // Handle uninformative generic strings like 'known_anomaly', 'know_anomaly', 'temp', or empty
  const s = String(sensor || "").toLowerCase();
  if (
    raw === "known_anomaly" ||
    raw === "know_anomaly" ||
    raw === "temp" ||
    raw === "temperature" ||
    raw === "hum" ||
    raw === "humidity" ||
    raw === "press" ||
    raw === "pressure" ||
    !raw
  ) {
    const numVal = Number(value);
    if (s.includes("temp") || raw.includes("temp")) {
      if (!isNaN(numVal)) {
        return numVal > 45 ? "Temperature Spike" : numVal < 5 ? "Cryogenic Dip" : "Thermal Spike";
      }
      return "Thermal Anomaly";
    }
    if (s.includes("hum") || raw.includes("hum")) {
      if (!isNaN(numVal)) {
        return numVal > 85 ? "Humidity Surge" : numVal < 15 ? "Arid Drop" : "Humidity Surge";
      }
      return "Humidity Anomaly";
    }
    if (s.includes("press") || raw.includes("press")) {
      if (!isNaN(numVal)) {
        return numVal > 1040 ? "Pressure Surge" : numVal < 970 ? "Barometric Drop" : "Pressure Surge";
      }
      return "Pressure Anomaly";
    }
    return "Physical Fault";
  }

  // Fallback: Convert snake_case or kebab-case to Title Case
  return raw
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseApiError(error) {
  if (!error) return "An unexpected error occurred.";
  if (error.response) {
    const msg = error.response.data?.message;
    if (msg) return msg;
    switch (error.response.status) {
      case 400: return "Bad request. Please check your input.";
      case 401: return "Your session has expired. Please log in again.";
      case 403: return "You do not have permission to perform this action.";
      case 404: return "The requested resource was not found.";
      case 500: return "Internal server error. Please try again later.";
      default: return `Server error (${error.response.status}).`;
    }
  }
  if (error.request) return "No response from server. Check your network connection.";
  return error.message || "An unexpected error occurred.";
}

/**
 * Export anomaly records to a standard CSV download for reporting & auditing
 */
export function exportAnomaliesToCSV(anomalies, filename = "skyguard_anomalies_report.csv") {
  if (!anomalies || anomalies.length === 0) return;

  const headers = [
    "Anomaly ID",
    "Station ID",
    "Sensor",
    "Value",
    "Anomaly Type",
    "Severity",
    "Confidence (%)",
    "Status",
    "Detected At",
    "Timestamp",
    "Message",
    "Recommended Action",
  ];

  const rows = anomalies.map((a) => [
    `"${a._id || ""}"`,
    `"${a.stationId || ""}"`,
    `"${a.sensor || ""}"`,
    a.value !== undefined ? a.value : "",
    `"${formatFaultType(a.anomalyType, a.sensor, a.value)}"`,
    `"${a.severity || ""}"`,
    a.confidence !== undefined ? (Number(a.confidence) * 100).toFixed(1) : "",
    `"${a.status || ""}"`,
    `"${a.detectedAt || a.timestamp || ""}"`,
    `"${a.timestamp || ""}"`,
    `"${(a.message || "").replace(/"/g, '""')}"`,
    `"${(a.action || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Synthesize an alert sound using Web Audio API
 */
export function playAlertSound(severity = "high") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === "critical" ? "sawtooth" : "sine";
    const freq = severity === "critical" ? 880 : severity === "high" ? 660 : 440;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Beep envelope
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio might be blocked if user hasn't interacted yet
  }
}
