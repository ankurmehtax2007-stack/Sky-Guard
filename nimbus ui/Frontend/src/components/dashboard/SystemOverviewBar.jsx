import { useRealtimeReadings, useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { useAnomalies } from "../../hooks/useAnomalies";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

function StatItem({ label, value, variant, sub, unit, icon: Icon }) {
  const valueClass = variant ? `stat-item-value stat-item-value--${variant}` : "stat-item-value";
  return (
    <div className="stat-item">
      <div className="stat-item-top">
        <span className="stat-item-icon">{Icon ? <Icon size={16} strokeWidth={1.8} /> : <Activity size={16} />}</span>
        <span className="stat-item-label">{label}</span>
      </div>
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
  const activeAnomalies = anomalies.filter((a) => a.status === "pending").length;
  const criticalAnomalies = anomalies.filter(
    (a) => a.status === "pending" && a.severity === "critical"
  ).length;

  const loading = rLoading || aLoading;

  return (
    <div
      className="contents"
      aria-label="System overview telemetry statistics"
    >
      <StatItem
        label="Total Anomalies"
        icon={AlertTriangle}
        value={loading ? "—" : anomalies.length}
        variant="muted"
        sub="All recorded incidents"
      />
      <StatItem
        label="Active Anomalies"
        icon={AlertTriangle}
        value={loading ? "—" : activeAnomalies}
        variant={activeAnomalies > 0 ? (criticalAnomalies > 0 ? "red" : "amber") : "green"}
        sub={criticalAnomalies > 0 ? `${criticalAnomalies} Critical alert` : "All stations stable"}
      />
      <StatItem
        label="Resolved Anomalies"
        icon={CheckCircle2}
        value={loading ? "—" : anomalies.filter((a) => String(a.status || "").toLowerCase() === "resolved").length}
        variant="green"
        sub="Incidents already resolved"
      />
    </div>
  );
}