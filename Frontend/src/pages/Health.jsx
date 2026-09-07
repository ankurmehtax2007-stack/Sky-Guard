import { AppLayout } from "../components/layout/AppLayout";
import { SystemHealth } from "../components/dashboard/SystemHealth";
import { useHealth } from "../hooks/useHealth";
import { SERVICE_LABELS } from "../utils/constants";
import { Server, Database, Radio, Cpu, Network, ExternalLink } from "lucide-react";

function ServiceRow({ name, status, icon: Icon, desc }) {
  const isUp = status === "up";
  return (
    <div className="service-detail-row">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {Icon && <Icon size={16} style={{ color: isUp ? "var(--color-green)" : "var(--color-red)" }} />}
        <div>
          <div className="service-detail-name">{name}</div>
          {desc && <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{desc}</div>}
        </div>
      </div>
      <div className={`service-detail-status ${isUp ? "text-green" : "text-red"}`}>
        <span className={`status-dot ${isUp ? "dot-green" : "dot-red"}`} />
        {isUp ? "Operational" : "Offline / Unreachable"}
      </div>
    </div>
  );
}

export function Health() {
  const { data, loading, error, refetch } = useHealth();
  const isHealthy = data?.status === "healthy";

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";

  return (
    <AppLayout pageTitle="System Infrastructure & Health">
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h2 className="page-heading">Infrastructure Health &amp; Pipeline Architecture</h2>
            <p className="page-description">
              End-to-end distributed system monitoring for Smart India Hackathon
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href={`${apiBase}/metrics`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <span>Prometheus Metrics</span>
              <ExternalLink size={12} />
            </a>
            <button className="btn btn-secondary btn-sm" onClick={refetch} disabled={loading}>
              {loading ? "Refreshing…" : "Probe Services"}
            </button>
          </div>
        </div>

        <SystemHealth />

        {/* SIH Distributed Pipeline Architecture Diagram */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">SkyGuard Distributed Telemetry &amp; AI Pipeline</h3>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Real-Time Data Flow</span>
          </div>
          <div style={{ padding: "var(--space-5)" }}>
            <div className="arch-flow">
              <div className="arch-node">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Radio size={16} color="#38bdf8" />
                  <span className="arch-node-title">AWS Fleet / Sim</span>
                </div>
                <div className="arch-node-status">
                  <span className="live-dot live-dot--pulse" />
                  <span>3+ Ground Stations</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Publishes weather readings every 5s with 5% fault injection probability.
                </div>
              </div>

              <div className="arch-node">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Network size={16} color="#a78bfa" />
                  <span className="arch-node-title">MQTT Broker</span>
                </div>
                <div className="arch-node-status">
                  <span className="live-dot live-dot--pulse" />
                  <span>Port 1883</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  High-throughput pub/sub on <code>weather/readings/#</code>
                </div>
              </div>

              <div className="arch-node">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Server size={16} color="#34d399" />
                  <span className="arch-node-title">Express API &amp; WS</span>
                </div>
                <div className="arch-node-status">
                  <span className="live-dot live-dot--pulse" />
                  <span>Port 3000</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Persists readings to MongoDB &amp; broadcasts over WebSocket.
                </div>
              </div>

              <div className="arch-node">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Cpu size={16} color="#f59e0b" />
                  <span className="arch-node-title">ML Anomaly Engine</span>
                </div>
                <div className="arch-node-status">
                  <span className="live-dot live-dot--pulse" />
                  <span>AI Inference</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Isolation Forest + XGBoost models scoring temperature, humidity, pressure.
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Subsystem Health Probes</h3>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {isHealthy ? "All Probes Passing" : "Degraded State Detected"}
              </span>
            </div>
            <div className="service-detail-list">
              {loading ? (
                <div className="muted-text" style={{ padding: "var(--space-4)" }}>Probing services…</div>
              ) : data?.services ? (
                <>
                  <ServiceRow
                    name={SERVICE_LABELS.mongodb}
                    desc="Mongoose connection pool for weather telemetry persistence"
                    status={data.services.mongodb?.status}
                    icon={Database}
                  />
                  <ServiceRow
                    name={SERVICE_LABELS.mqtt}
                    desc="MQTT v5 client connected to local or remote cluster broker"
                    status={data.services.mqtt?.status}
                    icon={Network}
                  />
                  <ServiceRow
                    name={SERVICE_LABELS.ml}
                    desc="FastAPI / ML Service scoring incoming sensor telemetry"
                    status={data.services.ml?.status}
                    icon={Cpu}
                  />
                </>
              ) : (
                <div className="muted-text" style={{ padding: "var(--space-4)" }}>
                  No service telemetry returned from probe.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Health;
