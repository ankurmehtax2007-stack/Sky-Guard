import { useState, useMemo } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AnomalyTable } from "../components/anomalies/AnomalyTable";
import { AnomalyFilters, applyAnomalyFilters } from "../components/anomalies/AnomalyFilters";
import { AnomalyDetails } from "../components/anomalies/AnomalyDetails";
import { Modal } from "../components/common/Modal";
import { ErrorState } from "../components/common/ErrorState";
import { useAnomalies } from "../hooks/useAnomalies";
import { useRealtimeAnomalies } from "../hooks/useRealtimeData";
import { useWsStatus } from "../context/WebSocketContext";
import { exportAnomaliesToCSV } from "../utils/formatters";
import { Download, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export default function Anomalies() {
  const { data: baseAnomalies, pagination, loading, error, refetch } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);
  const wsStatus = useWsStatus();

  const [filters, setFilters] = useState({
    search: "",
    stationId: "",
    sensor: "",
    severity: "",
    status: "",
  });
  const [selectedId, setSelectedId] = useState(null);

  const stations = useMemo(() => {
    const ids = anomalies.map((a) => a.stationId).filter(Boolean);
    return [...new Set(ids)].sort();
  }, [anomalies]);

  const filtered = useMemo(
    () => applyAnomalyFilters(anomalies, filters),
    [anomalies, filters]
  );

  // Triage incident counts
  const totalFaultCount = pagination?.total ? Math.max(pagination.total, anomalies.length) : anomalies.length;
  const pendingCount = anomalies.filter((a) => a.status === "pending").length;
  const criticalCount = anomalies.filter((a) => a.status === "pending" && a.severity === "critical").length;
  const resolvedCount = anomalies.filter((a) => a.status === "resolved").length;

  const handleExportCSV = () => {
    exportAnomaliesToCSV(filtered, `skyguard_anomalies_${Date.now()}.csv`);
  };

  return (
    <AppLayout pageTitle="Anomalies Operations Center">
      <div className="page-stack">
        {/* Page Header with Actions */}
        <div className="page-header-row" style={{ flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 className="page-heading">Anomaly Detection Log</h2>
              <span
                className={`live-dot ${wsStatus === "connected" ? "live-dot--pulse" : "live-dot--gray"}`}
                title={`Live telemetry: ${wsStatus}`}
              />
            </div>
            <p className="page-description">
              {!loading && !error
                ? `Showing ${filtered.length} of ${anomalies.length} AI-classified sensor faults across all stations`
                : "Real-time fault tracking and remediation"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={refetch}
              disabled={loading}
              title="Refresh anomaly data from server"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              Refresh
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              title="Export filtered records to CSV"
            >
              <Download size={13} />
              Export CSV Report
            </button>
          </div>
        </div>

        {/* Incident Triage Summary Cards */}
        <div className="stat-bar" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div className="stat-item">
            <span className="stat-item-label">Total Faults</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} style={{ color: "var(--color-accent)" }} />
              <span className="stat-item-value">{loading ? "—" : totalFaultCount}</span>
            </div>
            <span className="stat-item-sub">All logged incidents</span>
          </div>

          <div className="stat-item">
            <span className="stat-item-label">Pending Triage</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} style={{ color: "var(--color-amber)" }} />
              <span className="stat-item-value stat-item-value--amber">{loading ? "—" : pendingCount}</span>
            </div>
            <span className="stat-item-sub">Awaiting action</span>
          </div>

          <div className="stat-item">
            <span className="stat-item-label">Critical Alerts</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={18} style={{ color: "var(--color-red)" }} />
              <span className="stat-item-value stat-item-value--red">{loading ? "—" : criticalCount}</span>
            </div>
            <span className="stat-item-sub">Requires immediate fix</span>
          </div>

          <div className="stat-item">
            <span className="stat-item-label">Resolved</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} style={{ color: "var(--color-green)" }} />
              <span className="stat-item-value stat-item-value--green">{loading ? "—" : resolvedCount}</span>
            </div>
            <span className="stat-item-sub">Closed incidents</span>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <AnomalyFilters
              filters={filters}
              onChange={setFilters}
              stations={stations}
            />
            <div className="card">
              <AnomalyTable
                anomalies={filtered}
                loading={loading}
                onViewDetail={setSelectedId}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Anomaly Investigation & AI Explainability"
        size="lg"
      >
        {selectedId && <AnomalyDetails anomalyId={selectedId} onUpdated={refetch} />}
      </Modal>
    </AppLayout>
  );
}
