import { useState, useEffect, useMemo, useCallback } from "react";
import { useWsMessage } from "../../context/WebSocketContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getStationReadings } from "../../api/reading";
import { SENSOR_RANGES } from "../../utils/constants";
import { formatDateShort } from "../../utils/formatters";
import { Activity, Thermometer, Droplets, Gauge, SlidersHorizontal } from "lucide-react";

const STATION_PALETTE = {
  AWS_01: "#38bdf8", // Sky Blue
  AWS_02: "#34d399", // Emerald
  AWS_03: "#a78bfa", // Purple
  DEFAULT: "#fbbf24", // Amber
};

const TIME_RANGES = ["1H", "6H", "24H", "7D", "30D"];

export function FleetTelemetryChart() {
  const [selectedSensor, setSelectedSensor] = useState("temperature"); // temperature, humidity, pressure
  const [selectedRange, setSelectedRange] = useState("24H");
  const [readingsData, setReadingsData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch recent readings for AWS_01, AWS_02, AWS_03
  useEffect(() => {
    let mounted = true;
    const fetchFleetData = async () => {
      try {
        const [r1, r2, r3] = await Promise.allSettled([
          getStationReadings("AWS_01", { limit: 15 }),
          getStationReadings("AWS_02", { limit: 15 }),
          getStationReadings("AWS_03", { limit: 15 }),
        ]);

        if (!mounted) return;

        const map = {};
        if (r1.status === "fulfilled" && r1.value.data?.readings) {
          map["AWS_01"] = r1.value.data.readings;
        }
        if (r2.status === "fulfilled" && r2.value.data?.readings) {
          map["AWS_02"] = r2.value.data.readings;
        }
        if (r3.status === "fulfilled" && r3.value.data?.readings) {
          map["AWS_03"] = r3.value.data.readings;
        }

        setReadingsData(map);
      } catch {
        // keep fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFleetData();
    const interval = setInterval(fetchFleetData, 10000); // 10s sync
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Listen to live readings from WebSocket to stream telemetry in real time
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "READING_UPDATED" && msg.data?.stationId) {
      const r = msg.data;
      setReadingsData((prev) => {
        const existing = prev[r.stationId] || [];
        if (existing.some((item) => item._id === r._id)) return prev;
        return {
          ...prev,
          [r.stationId]: [r, ...existing].slice(0, 20),
        };
      });
    }
  }, []);

  useWsMessage(handleWsMessage);

  // Format merged timeline data for chart
  const chartData = useMemo(() => {
    const stations = Object.keys(readingsData);
    if (stations.length === 0) return [];

    const baseStation = stations.reduce((max, s) => {
      return (readingsData[s]?.length || 0) > (readingsData[max]?.length || 0) ? s : max;
    }, stations[0]);

    const baseList = [...(readingsData[baseStation] || [])].reverse();

    return baseList.map((reading, index) => {
      const point = {
        time: formatDateShort(reading.timestamp),
        rawTime: reading.timestamp,
      };

      stations.forEach((stId) => {
        const list = readingsData[stId];
        if (list) {
          const rev = [...list].reverse();
          const match = rev[index];
          if (
            match &&
            match[selectedSensor] !== undefined &&
            match[selectedSensor] !== null &&
            !isNaN(Number(match[selectedSensor]))
          ) {
            point[stId] = Number(match[selectedSensor]);
          }
        }
      });

      return point;
    });
  }, [readingsData, selectedSensor]);

  const sensorConfig = SENSOR_RANGES[selectedSensor] || SENSOR_RANGES.temperature;

  return (
    <div className="telemetry-stream-card">
      <div className="telemetry-stream-header">
        <div className="telemetry-stream-title-group">
          <div className="telemetry-icon-box">
            <Activity size={18} style={{ color: "#38bdf8" }} />
          </div>
          <div>
            <h2 className="telemetry-stream-title">Multi-Station Telemetry Stream</h2>
            <p className="telemetry-stream-subtitle">
              Real-time view of temperature, humidity and pressure across selected stations
            </p>
          </div>
        </div>

        {/* Controls: Time ranges & Sensor switcher */}
        <div className="telemetry-controls-wrap">
          {/* Time range pills */}
          <div className="telemetry-range-group">
            {TIME_RANGES.map((rng) => (
              <button
                key={rng}
                className={`telemetry-range-btn ${selectedRange === rng ? "telemetry-range-btn--active" : ""}`}
                onClick={() => setSelectedRange(rng)}
              >
                {rng}
              </button>
            ))}
          </div>

          {/* Sensor switch buttons */}
          <div className="telemetry-sensor-group">
            <button
              className={`telemetry-sensor-btn ${selectedSensor === "temperature" ? "telemetry-sensor-btn--active" : ""}`}
              onClick={() => setSelectedSensor("temperature")}
              title="Temperature"
            >
              <Thermometer size={12} style={{ display: "inline", marginRight: "3px" }} />
              Temp
            </button>
            <button
              className={`telemetry-sensor-btn ${selectedSensor === "humidity" ? "telemetry-sensor-btn--active" : ""}`}
              onClick={() => setSelectedSensor("humidity")}
              title="Humidity"
            >
              <Droplets size={12} style={{ display: "inline", marginRight: "3px" }} />
              Hum
            </button>
            <button
              className={`telemetry-sensor-btn ${selectedSensor === "pressure" ? "telemetry-sensor-btn--active" : ""}`}
              onClick={() => setSelectedSensor("pressure")}
              title="Pressure"
            >
              <Gauge size={12} style={{ display: "inline", marginRight: "3px" }} />
              Press
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Loading telemetry trends…</span>
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            Telemetry stream synchronizing. Data will populate shortly.
          </span>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260, minHeight: 260 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                {Object.keys(readingsData).map((stId) => {
                  const color = STATION_PALETTE[stId] || STATION_PALETTE.DEFAULT;
                  return (
                    <linearGradient key={stId} id={`grad_${stId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                  );
                })}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                unit={` ${sensorConfig.unit}`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1527",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconType="circle"
              />

              {Object.keys(readingsData).map((stId) => {
                const color = STATION_PALETTE[stId] || STATION_PALETTE.DEFAULT;
                return (
                  <Area
                    key={stId}
                    type="monotone"
                    dataKey={stId}
                    name={stId}
                    stroke={color}
                    strokeWidth={2.4}
                    fillOpacity={1}
                    fill={`url(#grad_${stId})`}
                    dot={{ r: 2.5, fill: color }}
                    activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
                    connectNulls
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
