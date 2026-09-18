import { useAnomalies } from "../../hooks/useAnomalies";
import { useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

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
  const { data: baseAnomalies, loading, error } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);

  const normalized = anomalies.map((a) => String(a.status || "pending").toLowerCase());
  const total = normalized.length;
  const resolved = normalized.filter((s) => s === "resolved").length;
  const active = normalized.filter((s) => ["pending", "active", "ongoing"].includes(s)).length;

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
            value={loading ? "—" : total}
            description="All recorded incidents"
            tone="blue"
          />
          <CountCard
            icon={AlertTriangle}
            label="Active Anomalies"
            value={loading ? "—" : active}
            description="Incidents requiring attention"
            tone="red"
          />
          <CountCard
            icon={CheckCircle2}
            label="Resolved Anomalies"
            value={loading ? "—" : resolved}
            description="Incidents already resolved"
            tone="green"
          />
        </div>
      )}
    </section>
  );
}
