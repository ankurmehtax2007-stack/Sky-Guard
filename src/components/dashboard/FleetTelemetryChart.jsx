import { useState, useEffect, useMemo, useCallback } from "react";
import { useWsMessage } from "../../context/WebSocketContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { getStationReadings } from "../../api/reading";
import { SENSOR_RANGES } from "../../utils/constants";
import { formatDateShort } from "../../utils/formatters";
import { Activity, Thermometer, Droplets, Gauge } from "lucide-react";

const STATION_PALETTE = {
  AWS_01: "#f8fafc",
  AWS_02: "#38bdf8",
  AWS_03: "#c084fc",
  DEFAULT: "#34d399",
};

const SENSOR_CONFIG = [
  {
    key: "temperature",
    title: "Temperature",
    unit: "°C",
    icon: Thermometer,
    accent: "#38bdf8",
  },
  {
    key: "humidity",
    title: "Humidity",
    unit: "%",
    icon: Droplets,
    accent: "#34d399",
  },
  {
    key: "pressure",
    title: "Pressure",
    unit: "hPa",
    icon: Gauge,
    accent: "#c084fc",
  },
];

function buildChartData(readingsData, sensor) {
  const stations = Object.keys(readingsData);
  if (stations.length === 0) return [];

  const baseStation = stations.reduce((max, stationId) => {
    return (readingsData[stationId]?.length || 0) > (readingsData[max]?.length || 0)
      ? stationId
      : max;
  }, stations[0]);

  const baseList = [...(readingsData[baseStation] || [])].reverse();
  const reversed = Object.fromEntries(
    stations.map((stationId) => [stationId, [...(readingsData[stationId] || [])].reverse()])
  );

  return baseList.map((reading, index) => {
    const point = {
      time: formatDateShort(reading.timestamp),
      rawTime: reading.timestamp,
    };

    stations.forEach((stationId) => {
      const match = reversed[stationId]?.[index];
      const value = match?.[sensor];
      if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
        point[stationId] = Number(value);
      }
    });

    return point;
  });
}

function SparkleDot({ cx, cy, fill }) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  return (
    <g className="sparkle-point">
      <circle cx={cx} cy={cy} r="6" fill={fill} opacity="0.10" />
      <circle cx={cx} cy={cy} r="3.2" fill={fill} opacity="0.28" />
      <circle cx={cx} cy={cy} r="1.9" fill="#ffffff" />
      <path d={`M ${cx - 5} ${cy} H ${cx + 5} M ${cx} ${cy - 5} V ${cy + 5}`} stroke="#ffffff" strokeWidth="0.7" opacity="0.85" />
    </g>
  );
}

function SparkleChart({ config, data, stations }) {
  const range = SENSOR_RANGES[config.key] || SENSOR_RANGES.temperature;
  const Icon = config.icon;

  return (
    <article className="telemetry-mini-card">
      <div className="telemetry-mini-header">
        <div className="telemetry-mini-title">
          <span className="telemetry-icon-wrap" style={{ "--sensor-accent": config.accent }}>
            <Icon size={18} strokeWidth={1.8} />
          </span>
          <div>
            <h3>{config.title}</h3>
            <span>Live multi-station stream · {config.unit}</span>
          </div>
        </div>
        <span className="telemetry-live-chip"><span /> LIVE</span>
      </div>

      <div className="telemetry-chart-wrap">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
          <LineChart data={data} margin={{ top: 18, right: 10, left: -10, bottom: 4 }}>
            <defs>
              <filter id={`line-glow-${config.key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id={`soft-glow-${config.key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <CartesianGrid stroke="rgba(191,219,254,0.13)" strokeDasharray="2 7" vertical={true} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#dbeafe" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(226,232,240,0.26)" }}
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#dbeafe" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(226,232,240,0.18)" }}
              domain={["auto", "auto"]}
              width={38}
              tickFormatter={(value) => Number(value).toFixed(0)}
            />
            <Tooltip
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value, name) => [`${Number(value).toFixed(1)} ${config.unit}`, name]}
              contentStyle={{
                background: "rgba(3, 8, 22, 0.88)",
                border: "1px solid rgba(125,211,252,0.35)",
                borderRadius: "10px",
                boxShadow: "0 0 30px rgba(56,189,248,0.20)",
                fontSize: "11px",
                color: "#f8fafc",
                backdropFilter: "blur(12px)",
              }}
            />
            <Legend verticalAlign="bottom" height={26} wrapperStyle={{ fontSize: "10px", color: "#e2e8f0" }} iconType="circle" />

            {stations.map((stationId) => {
              const color = STATION_PALETTE[stationId] || STATION_PALETTE.DEFAULT;
              return (
                <Line
                  key={`${config.key}-${stationId}`}
                  type="monotone"
                  dataKey={stationId}
                  name={stationId}
                  stroke={color}
                  strokeWidth={4.5}
                  strokeOpacity={0.30}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={false}
                  filter={`url(#soft-glow-${config.key})`}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
            {stations.map((stationId) => {
              const color = STATION_PALETTE[stationId] || STATION_PALETTE.DEFAULT;
              return (
                <Line
                  key={`${config.key}-${stationId}-core`}
                  type="monotone"
                  dataKey={stationId}
                  name={stationId}
                  stroke={color}
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={<SparkleDot fill={color} />}
                  activeDot={{ r: 5, fill: "#ffffff", stroke: color, strokeWidth: 2 }}
                  filter={`url(#line-glow-${config.key})`}
                  connectNulls
                  isAnimationActive
                  animationDuration={800}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="telemetry-mini-footer">
        <span className="telemetry-range">Expected {range.min}–{range.max} {range.unit}</span>
        <span>{stations.length} active station{stations.length === 1 ? "" : "s"}</span>
      </div>
    </article>
  );
}

export function FleetTelemetryChart() {
  const [readingsData, setReadingsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchFleetData = async () => {
      try {
        const [r1, r2, r3] = await Promise.allSettled([
          getStationReadings("AWS_01", { limit: 20 }),
          getStationReadings("AWS_02", { limit: 20 }),
          getStationReadings("AWS_03", { limit: 20 }),
        ]);

        if (!mounted) return;

        const next = {};
        if (r1.status === "fulfilled" && r1.value?.data?.readings) next.AWS_01 = r1.value.data.readings;
        if (r2.status === "fulfilled" && r2.value?.data?.readings) next.AWS_02 = r2.value.data.readings;
        if (r3.status === "fulfilled" && r3.value?.data?.readings) next.AWS_03 = r3.value.data.readings;
        setReadingsData(next);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFleetData();
    const interval = setInterval(fetchFleetData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type !== "READING_UPDATED" || !msg.data?.stationId) return;
    const reading = msg.data;

    setReadingsData((prev) => {
      const existing = prev[reading.stationId] || [];
      if (reading._id && existing.some((item) => item._id === reading._id)) return prev;
      return {
        ...prev,
        [reading.stationId]: [reading, ...existing].slice(0, 20),
      };
    });
  }, []);

  useWsMessage(handleWsMessage);

  const stations = useMemo(() => Object.keys(readingsData), [readingsData]);
  const chartData = useMemo(() => {
    return Object.fromEntries(
      SENSOR_CONFIG.map((sensor) => [sensor.key, buildChartData(readingsData, sensor.key)])
    );
  }, [readingsData]);

  return (
    <section className="telemetry-dashboard-section">
      <div className="telemetry-section-heading">
        <div>
          <div className="section-kicker">
            <Activity size={16} />
            REAL-TIME TELEMETRY
          </div>
          <h2>Multi-Station Telemetry Stream</h2>
          <p>Temperature, humidity and pressure trends displayed together for fast fleet comparison.</p>
        </div>
        <div className="telemetry-status">
          <span className="telemetry-status-dot" />
          {stations.length ? `${stations.length} stations streaming` : "Synchronizing stations"}
        </div>
      </div>

      {loading && stations.length === 0 ? (
        <div className="telemetry-grid">
          {SENSOR_CONFIG.map((sensor) => (
            <div className="telemetry-mini-card telemetry-mini-card--loading" key={sensor.key}>
              <span>Loading {sensor.title.toLowerCase()} telemetry…</span>
            </div>
          ))}
        </div>
      ) : stations.length === 0 ? (
        <div className="telemetry-empty">
          <Activity size={18} />
          <span>Telemetry stream is synchronizing. Data will populate shortly.</span>
        </div>
      ) : (
        <div className="telemetry-grid">
          {SENSOR_CONFIG.map((sensor) => (
            <SparkleChart
              key={sensor.key}
              config={sensor}
              data={chartData[sensor.key]}
              stations={stations}
            />
          ))}
        </div>
      )}
    </section>
  );
}
