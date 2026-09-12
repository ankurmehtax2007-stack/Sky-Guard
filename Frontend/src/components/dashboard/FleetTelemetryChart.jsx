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

const STORAGE_KEY = "skyguard_fleet_telemetry_history";

function getInitialReadings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }

  // Pre-seed an initial 8-point baseline for active stations so lines display smoothly immediately
  const now = Date.now();
  const baseStations = {
    AWS_01: { temp: 28.5, hum: 56, press: 1012 },
    AWS_02: { temp: 31.0, hum: 74, press: 1009 },
    AWS_03: { temp: 24.8, hum: 62, press: 1010 },
  };

  const initial = {};
  Object.entries(baseStations).forEach(([stId, base]) => {
    initial[stId] = Array.from({ length: 8 }).map((_, i) => {
      const timeOffset = (7 - i) * 10000;
      const t = new Date(now - timeOffset).toISOString();
      return {
        _id: `seed_${stId}_${i}`,
        stationId: stId,
        timestamp: t,
        temperature: Number((base.temp + Math.sin(i * 0.8) * 0.5).toFixed(1)),
        humidity: Math.round(base.hum + Math.cos(i * 0.8) * 1.5),
        pressure: Math.round(base.press + Math.sin(i * 0.4) * 0.8),
      };
    }).reverse();
  });

  return initial;
}

function saveFleetHistory(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

function buildChartData(readingsData, sensor) {
  const stations = Object.keys(readingsData);
  if (stations.length === 0) return [];

  const timeBuckets = new Map();

  stations.forEach((stationId) => {
    const list = readingsData[stationId] || [];
    list.forEach((reading) => {
      if (!reading?.timestamp) return;
      const t = new Date(reading.timestamp).getTime();
      if (isNaN(t)) return;

      // Group packets within 6-second window into the same chronological time slice
      const bucketTime = Math.round(t / 6000) * 6000;
      if (!timeBuckets.has(bucketTime)) {
        timeBuckets.set(bucketTime, {
          time: formatDateShort(new Date(bucketTime).toISOString()),
          timestamp: bucketTime,
        });
      }

      const point = timeBuckets.get(bucketTime);
      const val = reading[sensor];
      if (val !== undefined && val !== null && !isNaN(Number(val))) {
        point[stationId] = Number(Number(val).toFixed(1));
      }
    });
  });

  const sortedPoints = Array.from(timeBuckets.values()).sort((a, b) => a.timestamp - b.timestamp);

  // Forward-fill & backward-fill gaps so continuous multi-station line curves render across time
  if (sortedPoints.length > 1) {
    stations.forEach((stationId) => {
      let lastKnown = null;
      for (let i = 0; i < sortedPoints.length; i++) {
        if (sortedPoints[i][stationId] !== undefined) {
          lastKnown = sortedPoints[i][stationId];
        } else if (lastKnown !== null) {
          sortedPoints[i][stationId] = lastKnown;
        }
      }
      let firstKnown = null;
      for (let i = sortedPoints.length - 1; i >= 0; i--) {
        if (sortedPoints[i][stationId] !== undefined) {
          firstKnown = sortedPoints[i][stationId];
        } else if (firstKnown !== null) {
          sortedPoints[i][stationId] = firstKnown;
        }
      }
    });
  }

  return sortedPoints.slice(-25); // show last 25 time steps over time
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
  const [readingsData, setReadingsData] = useState(getInitialReadings);
  const [loading, setLoading] = useState(false);

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

        const incoming = {};
        if (r1.status === "fulfilled" && r1.value?.data?.readings?.length) incoming.AWS_01 = r1.value.data.readings;
        if (r2.status === "fulfilled" && r2.value?.data?.readings?.length) incoming.AWS_02 = r2.value.data.readings;
        if (r3.status === "fulfilled" && r3.value?.data?.readings?.length) incoming.AWS_03 = r3.value.data.readings;

        if (Object.keys(incoming).length > 0) {
          setReadingsData((prev) => {
            const merged = { ...prev };
            Object.entries(incoming).forEach(([stId, newReadings]) => {
              const currentList = prev[stId] || [];
              const map = new Map();
              [...newReadings, ...currentList].forEach((r) => {
                const key = r._id || `${r.stationId}_${r.timestamp}`;
                if (!map.has(key)) map.set(key, r);
              });
              merged[stId] = Array.from(map.values())
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 30);
            });
            saveFleetHistory(merged);
            return merged;
          });
        }
      } catch {
        // Never wipe state on fetch error
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
      const updated = {
        ...prev,
        [reading.stationId]: [reading, ...existing].slice(0, 30),
      };
      saveFleetHistory(updated);
      return updated;
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
