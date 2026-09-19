import { useAnomalyStats } from "../../hooks/useAnomalyStats";
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
  const { stats, loading } = useAnomalyStats();

  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const critical = stats?.critical ?? 0;
  const resolved = stats?.resolved ?? 0;

  return (
    <div
      className="contents"
      aria-label="System overview telemetry statistics"
    >
      <StatItem
        label="Total Anomalies"
        icon={AlertTriangle}
        value={loading ? "—" : total.toLocaleString()}
        variant="muted"
        sub="All recorded incidents"
      />
      <StatItem
        label="Active Anomalies"
        icon={AlertTriangle}
        value={loading ? "—" : active.toLocaleString()}
        variant={active > 0 ? (critical > 0 ? "red" : "amber") : "green"}
        sub={critical > 0 ? `${critical} Critical alert${critical > 1 ? "s" : ""}` : (active > 0 ? `${active} Active incidents` : "All stations stable")}
      />
      <StatItem
        label="Resolved Anomalies"
        icon={CheckCircle2}
        value={loading ? "—" : resolved.toLocaleString()}
        variant="green"
        sub="Incidents already resolved"
      />
    </div>
  );
}