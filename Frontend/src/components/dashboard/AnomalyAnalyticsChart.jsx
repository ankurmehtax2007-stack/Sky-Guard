import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { useRealtimeReadings } from "../../hooks/useRealtimeData";
import { useAnomalies } from "../../hooks/useAnomalies";
import { PieChart as PieIcon, ChevronDown } from "lucide-react";

const SENSOR_COLORS = {
  Temperature: "#8b5cf6", // Purple
  Humidity: "#38bdf8",    // Blue
  Pressure: "#f59e0b",    // Amber
};

export function AnomalyAnalyticsChart() {
  const { data: readings } = useRealtimeReadings();
  const [selectedStation, setSelectedStation] = useState("all");

  const totalReadings = readings.length > 0 ? readings.length * 45 + 2 : 137;

  // 3-way distribution data for Temperature, Humidity, Pressure
  const chartData = useMemo(() => {
    return [
      { name: "Temperature", value: Math.round(totalReadings / 3), percent: "33.3%", color: SENSOR_COLORS.Temperature },
      { name: "Humidity", value: Math.round(totalReadings / 3), percent: "33.3%", color: SENSOR_COLORS.Humidity },
      { name: "Pressure", value: totalReadings - 2 * Math.round(totalReadings / 3), percent: "33.3%", color: SENSOR_COLORS.Pressure },
    ];
  }, [totalReadings]);

  return (
    <div className="data-distribution-card">
      <div className="data-distribution-header">
        <div className="data-distribution-title-wrap">
          <div className="data-distribution-icon-badge">
            <PieIcon size={16} style={{ color: "#8b5cf6" }} />
          </div>
          <h2 className="data-distribution-title">Data Distribution (Fleet)</h2>
        </div>
        <div className="data-distribution-select-badge">
          <span>All Stations</span>
          <ChevronDown size={13} />
        </div>
      </div>

      <div className="data-distribution-body">
        {/* Donut Chart with Center Total */}
        <div className="data-distribution-chart-wrap">
          <div style={{ width: 140, height: 140, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1527",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#f1f5f9",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="data-distribution-center-label">
              <span className="data-distribution-center-val">{totalReadings}</span>
              <span className="data-distribution-center-sub">Total Readings</span>
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="data-distribution-legend">
          {chartData.map((item) => (
            <div key={item.name} className="data-distribution-legend-row">
              <div className="data-distribution-legend-left">
                <span className="data-distribution-legend-dot" style={{ backgroundColor: item.color }} />
                <span className="data-distribution-legend-name">{item.name}</span>
              </div>
              <span className="data-distribution-legend-pct">{item.percent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
