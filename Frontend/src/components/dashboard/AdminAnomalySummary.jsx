import { useAnomalyStats } from "../../hooks/useAnomalyStats";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

function CountCard({ icon: Icon, label, value, tone, description }) {
  return (
    <div className={`admin-anomaly-card admin-anomaly-card--${tone}`}>
      <div className="admin-anomaly-icon"><Icon size={20} /></div>
      <div className="admin-anomaly-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

export function AdminAnomalySummary() {
  const { stats, loading, error } = useAnomalyStats();

  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const resolved = stats?.resolved ?? 0;

  return (
    <section className="admin-anomaly-summary">
      <div className="admin-anomaly-heading">
        <div>
          <span className="eyebrow">ANOMALY STATUS</span>
          <h2>Anomaly Overview</h2>
        </div>
        <span className="admin-anomaly-note">Live system status</span>
      </div>

      {error ? (
        <div className="admin-anomaly-error">Unable to load anomaly status.</div>
      ) : (
        <div className="admin-anomaly-grid">
          <CountCard
            icon={AlertTriangle}
            label="Total Anomalies"
            value={loading ? "—" : total.toLocaleString()}
            description="All recorded incidents"
            tone="blue"
          />
          <CountCard
            icon={AlertTriangle}
            label="Active Anomalies"
            value={loading ? "—" : active.toLocaleString()}
            description="Incidents requiring attention"
            tone="red"
          />
          <CountCard
            icon={CheckCircle2}
            label="Resolved Anomalies"
            value={loading ? "—" : resolved.toLocaleString()}
            description="Incidents already resolved"
            tone="green"
          />
        </div>
      )}
    </section>
  );
}
