const STORAGE_KEY = "skyguard_saved_anomalies";

export function loadSavedAnomalies() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnomaliesToStorage(anomalies) {
  try {
    if (!Array.isArray(anomalies)) return;
    // Cache latest anomalies for offline resilience
    const trimmed = anomalies.slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

export function normalizeReadingToAnomaly(reading) {
  if (!reading) return null;
  const pred = reading.anomalyPrediction || {};
  const isAnomaly =
    reading.anomaly === true ||
    reading.isAnomaly === true ||
    pred.isAnomaly === true ||
    reading.anomalyStatus === "detected" ||
    reading.anomalyStatus === "saved" ||
    (typeof reading.temperature === "number" && (reading.temperature > 45 || reading.temperature < 5)) ||
    (typeof reading.humidity === "number" && (reading.humidity > 92 || reading.humidity < 15)) ||
    (typeof reading.pressure === "number" && (reading.pressure > 1055 || reading.pressure < 955));

  if (!isAnomaly) return null;

  let sensor = pred.sensor;
  if (!sensor) {
    if (typeof reading.temperature === "number" && (reading.temperature > 45 || reading.temperature < 5)) {
      sensor = "temperature";
    } else if (typeof reading.humidity === "number" && (reading.humidity > 92 || reading.humidity < 15)) {
      sensor = "humidity";
    } else if (typeof reading.pressure === "number" && (reading.pressure > 1055 || reading.pressure < 955)) {
      sensor = "pressure";
    } else {
      sensor = "temperature";
    }
  }

  const val = typeof reading[sensor] === "number" ? reading[sensor] : reading.value ?? 0;
  const id =
    reading._id
      ? `anom_${reading._id}`
      : `anom_${reading.stationId}_${new Date(reading.timestamp || Date.now()).getTime()}`;

  let anomalyType = pred.anomalyType;
  if (
    !anomalyType ||
    anomalyType === "known_anomaly" ||
    anomalyType === "know_anomaly" ||
    anomalyType === "temp" ||
    anomalyType === "temperature" ||
    anomalyType === "humidity" ||
    anomalyType === "pressure"
  ) {
    if (sensor === "temperature") anomalyType = val > 45 ? "Thermal Spike" : "Cryogenic Dip";
    else if (sensor === "humidity") anomalyType = val > 90 ? "Moisture Saturation Surge" : "Arid Drop";
    else anomalyType = val > 1050 ? "Barometric Surge" : "Barometric Depression";
  }

  return {
    _id: id,
    stationId: reading.stationId || "AWS_01",
    sensor,
    value: val,
    anomalyType,
    severity: (pred.severity || (Math.abs(val) > 50 ? "critical" : "high")).toLowerCase(),
    confidence: pred.confidence !== undefined ? pred.confidence : 0.94,
    timestamp: reading.timestamp || new Date().toISOString(),
    detectedAt: reading.timestamp || new Date().toISOString(),
    status: reading.status || "pending",
    message:
      pred.message ||
      `Telemetry outlier on ${sensor.toUpperCase()}: ${val} detected outside baseline bounds at station ${reading.stationId}.`,
    action:
      pred.action ||
      `Deploy maintenance probe to inspect ${sensor} transducer calibration on ${reading.stationId}.`,
  };
}

export function mergeAnomalies(existing = [], incoming = []) {
  const map = new Map();

  const getDedupeKey = (item) => {
    if (!item) return null;
    if (item.readingId) return `read_${item.readingId}`;
    if (item._id && !String(item._id).startsWith("read_") && !String(item._id).startsWith("anom_")) {
      return `id_${item._id}`;
    }
    // Group identical station/sensor anomalies occurring within 15 seconds
    const timeVal = new Date(item.timestamp || item.detectedAt || 0).getTime();
    const windowSlot = Math.floor(timeVal / 15000);
    return `burst_${item.stationId || ""}_${item.sensor || ""}_${windowSlot}`;
  };

  // Process existing
  for (const a of existing) {
    if (!a) continue;
    const key = getDedupeKey(a);
    if (key) map.set(key, a);
  }

  // Process incoming, overwriting matching key with fresher data
  for (const b of incoming) {
    if (!b) continue;
    const key = getDedupeKey(b);
    if (key) {
      map.set(key, { ...(map.get(key) || {}), ...b });
    }
  }

  return Array.from(map.values()).sort(
    (x, y) => new Date(y.detectedAt || y.timestamp).getTime() - new Date(x.detectedAt || x.timestamp).getTime()
  );
}
