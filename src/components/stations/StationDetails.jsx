import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useStationReadings } from "../../hooks/useReadings";
import { useStationAnomalies } from "../../hooks/useAnomalies";
import { AnomalyBadge } from "../anomalies/AnomalyBadge";
import { AnomalyStatusBadge } from "../common/StatusBadge";
import { TableSkeleton } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyTableRow } from "../common/EmptyState";
import { Modal } from "../common/Modal";
import { AnomalyDetails as AnomalyModalDetails } from "../anomalies/AnomalyDetails";
import { formatDate, formatDateShort, formatSensorValue, getSensorLabel, formatFaultType } from "../../utils/formatters";
import { KNOWN_STATIONS, SENSOR_RANGES } from "../../utils/constants";
import { Thermometer, Droplets, Gauge, AlertTriangle, ExternalLink } from "lucide-react";

const SENSOR_THEMES = {
  temperature: { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.2)", unit: "°C" },
  humidity:    { stroke: "#34d399", fill: "rgba(52, 211, 153, 0.2)", unit: "%" },
  pressure:    { stroke: "#a78bfa", fill: "rgba(167, 139, 250, 0.2)", unit: "hPa" },
};

function SensorChart({ readings, sensor, label }) {
  if (!readings || readings.length < 2) return null;

  const chartData = [...readings]
    .reverse()
    .map((r) => ({
      time: formatDateShort(r.timestamp),
      value: r[sensor],
    }));

  const theme = SENSOR_THEMES[sensor] || SENSOR_THEMES.temperature;

  return (
    <div className="chart-block">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h4 className="chart-title" style={{ margin: 0 }}>{label}</h4>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{readings.length} points</span>
      </div>

      <div style={{ width: "100%", height: 170, minHeight: 170 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170}>
          <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill_${sensor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.stroke} stopOpacity={0.3} />
              <stop offset="95%" stopColor={theme.stroke} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
              fontSize: "12px",
              color: "#f1f5f9",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.stroke}
            strokeWidth={2}
            fill={`url(#fill_${sensor})`}
            dot={{ r: 2, fill: theme.stroke }}
            activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 1.5 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StationDetails({ stationId }) {
  const { data: readingData, loading: rLoading, error: rError, refetch: rRefetch } =
    useStationReadings(stationId);
  const { data: anomalies, loading: aLoading, error: aError, refetch: aRefetch } =
    useStationAnomalies(stationId);

  const [selectedAnomalyId, setSelectedAnomalyId] = useState(null);

  const readings = readingData?.readings ?? [];
  const meta = KNOWN_STATIONS[stationId] || { name: "Automatic Weather Station", location: "Active Node", elevation: "Standard" };

  // Calculate station extrema
  const temps = readings.map((r) => r.temperature).filter((v) => typeof v === "number");
  const hums = readings.map((r) => r.humidity).filter((v) => typeof v === "number");
  const press = readings.map((r) => r.pressure).filter((v) => typeof v === "number");

  const latestReading = readings[0];

  return (
    <div className="station-details">
      {/* Station Metadata & KPI Strip */}
      <div className="stat-bar" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="stat-item">
          <span className="stat-item-label">Station Profile</span>
          <span className="stat-item-value" style={{ fontSize: "16px", color: "var(--color-accent)" }}>
            {stationId}
          </span>
          <span className="stat-item-sub">{meta.location} • {meta.elevation}</span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label">Current Temperature</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span className="stat-item-value" style={{ color: "#38bdf8" }}>
              {latestReading?.temperature !== undefined ? latestReading.temperature.toFixed(1) : "—"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>°C</span>
          </div>
          <span className="stat-item-sub">
            {temps.length ? `Min: ${Math.min(...temps).toFixed(1)}°C | Max: ${Math.max(...temps).toFixed(1)}°C` : "Reading..."}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label">Current Humidity</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span className="stat-item-value" style={{ color: "#34d399" }}>
              {latestReading?.humidity !== undefined ? latestReading.humidity.toFixed(0) : "—"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>% RH</span>
          </div>
          <span className="stat-item-sub">
            {hums.length ? `Min: ${Math.min(...hums).toFixed(0)}% | Max: ${Math.max(...hums).toFixed(0)}%` : "Reading..."}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label">Current Barometric Pressure</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span className="stat-item-value" style={{ color: "#a78bfa" }}>
              {latestReading?.pressure !== undefined ? latestReading.pressure.toFixed(0) : "—"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>hPa</span>
          </div>
          <span className="stat-item-sub">
            {press.length ? `Min: ${Math.min(...press).toFixed(0)} | Max: ${Math.max(...press).toFixed(0)}` : "Reading..."}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label">Anomalies Detected</span>
          <span className={`stat-item-value ${anomalies.length > 0 ? "stat-item-value--red" : "stat-item-value--green"}`}>
            {aLoading ? "—" : anomalies.length}
          </span>
          <span className="stat-item-sub">
            {anomalies.filter((a) => a.status === "pending").length} Pending Triage
          </span>
        </div>
      </div>

      {/* Sensor Trends Area Charts */}
      <section className="station-section">
        <h3 className="section-title">Sensor Trends &amp; Telemetry Curves</h3>
        {rError ? (
          <ErrorState message={rError} onRetry={rRefetch} />
        ) : rLoading ? (
          <div className="chart-grid">
            {["temperature", "humidity", "pressure"].map((s) => (
              <div key={s} className="chart-block chart-block--loading">
                <div className="skeleton-bar" style={{ height: 160, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : readings.length < 2 ? (
          <p className="muted-text">Not enough data to display trends.</p>
        ) : (
          <div className="chart-grid">
            <SensorChart readings={readings} sensor="temperature" label="Temperature (°C)" />
            <SensorChart readings={readings} sensor="humidity" label="Humidity (% RH)" />
            <SensorChart readings={readings} sensor="pressure" label="Pressure (hPa)" />
          </div>
        )}
      </section>

      {/* Station Anomalies */}
      <section className="station-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="section-title">Station Anomaly Incidents</h3>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{anomalies.length} Records</span>
        </div>
        {aError ? (
          <ErrorState message={aError} onRetry={aRefetch} />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Detected At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {aLoading ? (
                  <TableSkeleton rows={4} cols={7} />
                ) : anomalies.length === 0 ? (
                  <EmptyTableRow cols={7} message="No anomalies recorded for this station." />
                ) : (
                  anomalies.map((a) => (
                    <tr key={a._id}>
                      <td>{getSensorLabel(a.sensor)}</td>
                      <td className="td-mono" style={{ color: "var(--color-red)", fontWeight: 600 }}>
                        {formatSensorValue(a.sensor, a.value)}
                      </td>
                      <td className="td-type">{formatFaultType(a.anomalyType, a.sensor, a.value)}</td>
                      <td><AnomalyBadge severity={a.severity} /></td>
                      <td className="td-time">{formatDate(a.detectedAt || a.timestamp)}</td>
                      <td><AnomalyStatusBadge status={a.status} /></td>
                      <td>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => setSelectedAnomalyId(a._id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                        >
                          <span>Diagnose</span>
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Sensor Telemetry Readings Table */}
      <section className="station-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="section-title">Raw Telemetry Ingestion Log</h3>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Showing latest {Math.min(20, readings.length)} readings
          </span>
        </div>
        {rError ? (
          <ErrorState message={rError} onRetry={rRefetch} />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                  <th>Pressure</th>
                  <th>Anomaly State</th>
                  <th>ML Status</th>
                </tr>
              </thead>
              <tbody>
                {rLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : readings.length === 0 ? (
                  <EmptyTableRow cols={6} message="No readings for this station." />
                ) : (
                  readings.slice(0, 25).map((r) => (
                    <tr key={r._id}>
                      <td className="td-time">{formatDate(r.timestamp)}</td>
                      <td className="td-mono">{formatSensorValue("temperature", r.temperature)}</td>
                      <td className="td-mono">{formatSensorValue("humidity", r.humidity)}</td>
                      <td className="td-mono">{formatSensorValue("pressure", r.pressure)}</td>
                      <td>
                        <span className={`badge ${r.anomalyStatus === "none" ? "badge-resolved" : "badge-severity-high"}`}>
                          {r.anomalyStatus ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.mlStatus === "processed" ? "badge-resolved" : "badge-pending"}`}>
                          {r.mlStatus ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Anomaly Diagnosis Modal */}
      <Modal
        isOpen={!!selectedAnomalyId}
        onClose={() => setSelectedAnomalyId(null)}
        title="Anomaly Investigation & AI Explainability"
        size="lg"
      >
        {selectedAnomalyId && (
          <AnomalyModalDetails
            anomalyId={selectedAnomalyId}
            onUpdated={() => {
              aRefetch();
              rRefetch();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
