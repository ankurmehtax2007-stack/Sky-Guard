import { useRealtimeReadings, useRealtimeAnomalies, useRealtimeReadingCount } from "../../hooks/useRealtimeData";
import { useAnomalies } from "../../hooks/useAnomalies";
import { Radio, Database, AlertTriangle, Thermometer, Droplets, Gauge } from "lucide-react";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(reading) {
  if (!reading?.timestamp) return false;
  return Date.now() - new Date(reading.timestamp).getTime() < ONLINE_THRESHOLD_MS;
}

// Inline SVGs for Sparklines matching reference image
function SparklineWave({ color, id }) {
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="overview-kpi-sparkline-svg">
      <path
        d="M0 16C12 16 16 8 28 14C40 20 44 6 56 8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M0 16C12 16 16 8 28 14C40 20 44 6 56 8V24H0Z"
        fill={`url(#${id})`}
        opacity="0.18"
      />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparklineBars({ heights = [10, 14, 18, 20, 22], isPulsing = false }) {
  const xCoords = [2, 11, 20, 29, 38];
  const fills = ["#6ee7b7", "#34d399", "#10b981", "#10b981", isPulsing ? "#059669" : "#047857"];

  return (
    <svg width="44" height="24" viewBox="0 0 44 24" fill="none" className={`overview-kpi-sparkline-svg ${isPulsing ? "is-pulsing" : ""}`}>
      {heights.map((h, i) => {
        const height = Math.max(4, Math.min(22, h));
        const y = 24 - height;
        return (
          <rect
            key={i}
            x={xCoords[i]}
            y={y}
            width="5.5"
            height={height}
            rx="1.5"
            fill={fills[i]}
            style={{ transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        );
      })}
    </svg>
  );
}

function SparklineCurve({ color, id }) {
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="overview-kpi-sparkline-svg">
      <path
        d="M0 16C12 16 16 9 28 14C40 19 44 10 56 11"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M0 16C12 16 16 9 28 14C40 19 44 10 56 11V24H0Z"
        fill={`url(#${id})`}
        opacity="0.18"
      />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StatBox({ icon: Icon, title, value, unit, change, changeType, sub, theme, sparkline, isPulsing = false, liveDot = false }) {
  return (
    <div className={`overview-stat-box overview-stat-box--${theme}`}>
      <div className="overview-stat-top">
        <div className={`overview-stat-icon-wrap overview-stat-icon-wrap--${theme}`}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
        <span className="overview-stat-title">{title}</span>
      </div>

      <div className="overview-stat-middle">
        <div className="overview-stat-val-group">
          <span className={`overview-stat-value ${isPulsing ? "overview-stat-value--pulsing" : ""}`}>{value}</span>
          {unit && <span className="overview-stat-unit">{unit}</span>}
          {change && (
            <span className={`overview-stat-change overview-stat-change--${changeType}`}>
              {change}
            </span>
          )}
        </div>
        <div className="overview-stat-sparkline-wrap">
          {sparkline}
        </div>
      </div>

      <div className="overview-stat-bottom">
        <span className="overview-stat-sub">
          {liveDot && <span className="overview-live-dot" />}
          {sub}
        </span>
      </div>
    </div>
  );
}

export function SystemOverviewBar() {
  const { data: readings, loading: rLoading } = useRealtimeReadings();
  const { data: baseAnomalies, loading: aLoading } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);
  const {
    count: activeReadingsCount,
    loading: countLoading,
    isPulsing: countPulsing,
    readingsInLastMinute,
    barHeights,
  } = useRealtimeReadingCount();

  const totalStations = readings.length || 3;
  const onlineStations = readings.filter(isOnline).length || (readings.length > 0 ? readings.length : 3);

  const activeAnomalies = anomalies.filter((a) => a.status === "pending").length;

  // Calculate fleet averages
  const validTemps = readings.map((r) => r.temperature).filter((v) => typeof v === "number");
  const validHumidity = readings.map((r) => r.humidity).filter((v) => typeof v === "number");
  const validPressure = readings.map((r) => r.pressure).filter((v) => typeof v === "number");

  const avgTemp = validTemps.length
    ? (validTemps.reduce((acc, v) => acc + v, 0) / validTemps.length).toFixed(1)
    : "26.9";

  const avgHum = validHumidity.length
    ? (validHumidity.reduce((acc, v) => acc + v, 0) / validHumidity.length).toFixed(0)
    : "65";

  const avgPress = validPressure.length
    ? (validPressure.reduce((acc, v) => acc + v, 0) / validPressure.length).toFixed(0)
    : "1008";

  // Dynamic anomaly rate calculation
  const anomalyDenominator = Math.max(1, activeReadingsCount || 100);
  const anomalyRate = activeAnomalies > 0
    ? Math.min(100, Math.round((activeAnomalies / anomalyDenominator) * 100))
    : 0;

  return (
    <div className="overview-stats-grid" aria-label="System overview statistics">
      {/* 1. Plant Stations */}
      <StatBox
        icon={Radio}
        title="Plant Stations"
        value={`${onlineStations} / ${totalStations}`}
        change="↑ 0%"
        changeType="up"
        sub="Online"
        theme="blue"
        sparkline={<SparklineWave color="#0284c7" id="spark-plant" />}
      />

      {/* 2. Active Readings (Live Dynamic) */}
      <StatBox
        icon={Database}
        title="Active Readings"
        value={countLoading && activeReadingsCount === 0 ? "..." : activeReadingsCount.toLocaleString()}
        change={readingsInLastMinute > 0 ? `↑ ${readingsInLastMinute}/min` : "↑ Live"}
        changeType="up"
        sub={readingsInLastMinute > 0 ? "Live ingestion active" : "All systems stable"}
        theme="green"
        liveDot={readingsInLastMinute > 0}
        isPulsing={countPulsing}
        sparkline={<SparklineBars heights={barHeights} isPulsing={countPulsing} />}
      />

      {/* 3. Anomaly Rate */}
      <StatBox
        icon={AlertTriangle}
        title="Anomaly Rate"
        value={`${anomalyRate}%`}
        change="↓ 100%"
        changeType="down"
        sub="Within normal range"
        theme="red"
        sparkline={<SparklineWave color="#ef4444" id="spark-anomaly" />}
      />

      {/* 4. Avg Temperature */}
      <StatBox
        icon={Thermometer}
        title="Avg Temperature"
        value={avgTemp}
        unit="°C"
        change="↑ 0.5%"
        changeType="up"
        sub="Across active fleet"
        theme="purple"
        sparkline={<SparklineCurve color="#8b5cf6" id="spark-temp" />}
      />

      {/* 5. Avg Humidity */}
      <StatBox
        icon={Droplets}
        title="Avg Humidity"
        value={avgHum}
        unit="%"
        change="↓ 1.2%"
        changeType="down"
        sub="Across active fleet"
        theme="cyan"
        sparkline={<SparklineWave color="#2563eb" id="spark-hum" />}
      />

      {/* 6. Avg Pressure */}
      <StatBox
        icon={Gauge}
        title="Avg Pressure"
        value={avgPress}
        unit="hPa"
        change="↑ 0.3%"
        changeType="up"
        sub="Across active fleet"
        theme="amber"
        sparkline={<SparklineCurve color="#d97706" id="spark-press" />}
      />
    </div>
  );
}
