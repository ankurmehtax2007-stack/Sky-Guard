import { useRealtimeReadings, useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { useAnomalies } from "../../hooks/useAnomalies";
import { useHealth } from "../../hooks/useHealth";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function isOnline(reading) {
  if (!reading?.timestamp) return false;
  return Date.now() - new Date(reading.timestamp).getTime() < ONLINE_THRESHOLD_MS;
}

function StatItem({ label, value, variant, sub, unit }) {
  const valueClass = variant ? `stat-item-value stat-item-value--${variant}` : "stat-item-value";
  return (
    <div className="stat-item">
      <span className="stat-item-label">{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span className={valueClass}>{value ?? "—"}</span>
        {unit && <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{unit}</span>}
      </div>
      {sub && <span className="stat-item-sub">{sub}</span>}
    </div>
  );
}

export function SystemOverviewBar() {
  const { data: readings, loading: rLoading } = useRealtimeReadings();
  const { data: baseAnomalies, loading: aLoading } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);
  const { data: health } = useHealth();

  const totalStations = readings.length;
  const onlineStations = readings.filter(isOnline).length;

  const activeAnomalies = anomalies.filter((a) => a.status === "pending").length;
  const criticalAnomalies = anomalies.filter(
    (a) => a.status === "pending" && a.severity === "critical"
  ).length;

  // Calculate fleet averages
  const validTemps = readings.map((r) => r.temperature).filter((v) => typeof v === "number");
  const validHumidity = readings.map((r) => r.humidity).filter((v) => typeof v === "number");
  const validPressure = readings.map((r) => r.pressure).filter((v) => typeof v === "number");

  const avgTemp = validTemps.length
    ? (validTemps.reduce((acc, v) => acc + v, 0) / validTemps.length).toFixed(1)
    : "—";

  const avgHum = validHumidity.length
    ? (validHumidity.reduce((acc, v) => acc + v, 0) / validHumidity.length).toFixed(0)
    : "—";

  const avgPress = validPressure.length
    ? (validPressure.reduce((acc, v) => acc + v, 0) / validPressure.length).toFixed(0)
    : "—";

  // Health index: % of online stations without active anomaly
  const anomalyStationIds = new Set(
    anomalies.filter((a) => a.status === "pending").map((a) => a.stationId)
  );
  const normalStations = readings.filter(
    (r) => isOnline(r) && !anomalyStationIds.has(r.stationId)
  ).length;

  const fleetHealthPct = totalStations > 0
    ? Math.round((normalStations / totalStations) * 100)
    : 100;

  const loading = rLoading || aLoading;

  return (
    <div
      className="stat-bar"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      aria-label="System overview telemetry statistics"
    >
      <StatItem
        label="Fleet Stations"
        value={loading ? "—" : `${onlineStations}/${totalStations}`}
        variant={onlineStations > 0 ? "green" : "muted"}
        sub={totalStations > 0 ? "Reporting online" : "Connecting..."}
      />
      <StatItem
        label="Active Anomalies"
        value={loading ? "—" : activeAnomalies}
        variant={activeAnomalies > 0 ? (criticalAnomalies > 0 ? "red" : "amber") : "green"}
        sub={criticalAnomalies > 0 ? `${criticalAnomalies} Critical alert` : "All stations stable"}
      />
      <StatItem
        label="Fleet Health"
        value={loading ? "—" : `${fleetHealthPct}%`}
        variant={fleetHealthPct > 80 ? "green" : fleetHealthPct > 50 ? "amber" : "red"}
        sub="Station integrity"
      />
      <StatItem
        label="Avg Temperature"
        value={loading ? "—" : avgTemp}
        unit="°C"
        sub="Across active fleet"
      />
      <StatItem
        label="Avg Humidity"
        value={loading ? "—" : avgHum}
        unit="% RH"
        sub="Fleet-wide mean"
      />
      <StatItem
        label="Avg Pressure"
        value={loading ? "—" : avgPress}
        unit="hPa"
        sub="Barometric average"
      />
    </div>
  );
}
