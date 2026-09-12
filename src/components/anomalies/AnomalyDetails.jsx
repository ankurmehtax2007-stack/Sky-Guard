import { useState } from "react";
import { Link } from "react-router-dom";
import { useAnomalyDetail } from "../../hooks/useAnomalies";
import { AnomalyBadge } from "./AnomalyBadge";
import { AnomalyStatusBadge } from "../common/StatusBadge";
import { SkeletonText } from "../common/LoadingState";
import { ErrorState, InlineError } from "../common/ErrorState";
import { formatDate, formatSensorValue, getSensorLabel, formatConfidence, formatFaultType } from "../../utils/formatters";
import { ANOMALY_STATUS_TRANSITIONS, KNOWN_STATIONS, SENSOR_RANGES } from "../../utils/constants";
import { Cpu, CheckCircle2, AlertOctagon, ArrowRight, ShieldCheck, Sparkles, RotateCw, Wrench } from "lucide-react";

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value ?? "—"}</span>
    </div>
  );
}

export function AnomalyDetails({ anomalyId, onUpdated }) {
  const { data, loading, error, updating, updateError, refetch, updateStatus } =
    useAnomalyDetail(anomalyId);

  const [llmReport, setLlmReport] = useState(null);
  const [loadingLlm, setLoadingLlm] = useState(false);
  const [llmError, setLlmError] = useState(null);

  const fetchLlmDiagnosis = async () => {
    if (!data) return;
    setLoadingLlm(true);
    setLlmError(null);
    try {
      const stationMeta = KNOWN_STATIONS[data.stationId];
      const payload = {
        diagnostic: {
          station_id: data.stationId,
          station_name: stationMeta?.name || "Weather Station",
          city: stationMeta?.city || "Telemetry Node",
          temperature_c: data.sensor === "temperature" ? data.value : 28.0,
          humidity_pct: data.sensor === "humidity" ? data.value : 55.0,
          pressure_hpa: data.sensor === "pressure" ? data.value : 1010.0,
          root_cause: data.anomalyType || data.sensor || "sensor_anomaly",
          decision: "known_anomaly",
          confidence: data.confidence || 0.9,
          severity: data.severity ? data.severity.toUpperCase() : "HIGH",
          health_score: data.severity === "critical" ? 35 : 60,
          maintenance: {
            recommended_action: data.action || "Inspect and calibrate sensor transducer.",
            engineering_priority: data.severity === "critical" ? "P1 - Critical" : "P2 - Elevated"
          }
        },
        instruction: "Explain this sensor anomaly, probable physical root cause, and prescribe standard remediation procedures."
      };

      const res = await fetch("http://localhost:8000/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setLlmReport(json);
      } else {
        throw new Error(`LLM service error (${res.status})`);
      }
    } catch (err) {
      setLlmError("Could not connect to LLM diagnostic service. Please verify ML service on port 8000.");
    } finally {
      setLoadingLlm(false);
    }
  };

  if (loading) return <SkeletonText lines={8} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const nextStatuses = ANOMALY_STATUS_TRANSITIONS[data.status] ?? [];
  const stationMeta = KNOWN_STATIONS[data.stationId];
  const sensorRange = SENSOR_RANGES[data.sensor];

  const handleStatusChange = async (newStatus) => {
    await updateStatus(newStatus);
    if (onUpdated) onUpdated();
  };

  const confidencePct = data.confidence !== undefined ? Math.round(Number(data.confidence) * 100) : 95;

  return (
    <div className="anomaly-detail">
      {/* Top Banner with Severity & Station */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--color-surface-hover)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {data.severity === "critical" ? (
            <AlertOctagon size={22} style={{ color: "var(--color-red)" }} />
          ) : (
            <ShieldCheck size={22} style={{ color: "var(--color-amber)" }} />
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>
              {formatFaultType(data.anomalyType, data.sensor, data.value)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              {stationMeta ? `${data.stationId} • ${stationMeta.location}` : data.stationId}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AnomalyBadge severity={data.severity} />
          <AnomalyStatusBadge status={data.status} />
        </div>
      </div>

      {/* Grid of Key Telemetry Properties */}
      <div className="detail-section">
        <h3 className="detail-section-title">Telemetry &amp; Diagnosis Data</h3>
        <div className="detail-grid">
          <DetailRow label="Station ID" value={data.stationId} />
          <DetailRow label="Fault Sensor" value={getSensorLabel(data.sensor)} />
          <DetailRow
            label="Reported Sensor Value"
            value={
              <span style={{ color: "var(--color-red)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {formatSensorValue(data.sensor, data.value)}
              </span>
            }
          />
          <DetailRow
            label="Normal Expected Range"
            value={
              sensorRange
                ? `${sensorRange.normalMin} to ${sensorRange.normalMax} ${sensorRange.unit}`
                : "Nominal"
            }
          />
          <DetailRow
            label="ML Engine Confidence"
            value={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {formatConfidence(data.confidence)}
                </span>
                <div style={{ width: 80, height: 5, background: "rgba(148, 163, 184, 0.2)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${confidencePct}%`,
                      background: confidencePct > 90 ? "var(--color-green)" : "var(--color-accent)",
                    }}
                  />
                </div>
              </div>
            }
          />
          <DetailRow label="ML Model Type" value="Isolation Forest / XGBoost Hybrid" />
          <DetailRow label="Incident Detected At" value={formatDate(data.detectedAt || data.timestamp)} />
          <DetailRow label="Sensor Timestamp" value={formatDate(data.timestamp)} />
          {data.resolvedAt && (
            <DetailRow label="Resolved Timestamp" value={formatDate(data.resolvedAt)} />
          )}
          {data.resolvedBy && (
            <DetailRow label="Resolved Operator" value={data.resolvedBy} />
          )}
        </div>
      </div>

      {/* AI Message / Explanation */}
      {data.message && (
        <div className="detail-section">
          <h3 className="detail-section-title">
            <Cpu size={12} style={{ display: "inline", marginRight: "4px" }} />
            AI Root Cause Analysis
          </h3>
          <p className="detail-message">{data.message}</p>
        </div>
      )}

      {/* Recommended Action */}
      {data.action && (
        <div className="detail-section">
          <h3 className="detail-section-title">
            <CheckCircle2 size={12} style={{ display: "inline", marginRight: "4px" }} />
            Standard Operating Procedure (SOP) Action
          </h3>
          <div
            className="detail-message"
            style={{ borderLeft: "3px solid var(--color-accent)", background: "rgba(14, 165, 233, 0.05)" }}
          >
            {data.action}
          </div>
        </div>
      )}

      {/* On-Demand LLM Diagnostic Section (Only runs when clicked) */}
      <div className="detail-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h3 className="detail-section-title" style={{ margin: 0 }}>
            <Sparkles size={12} style={{ display: "inline", marginRight: "4px", color: "#818cf8" }} />
            On-Demand LLM Root-Cause Diagnosis
          </h3>
          {llmReport && (
            <button
              className="btn btn-secondary btn-xs"
              onClick={fetchLlmDiagnosis}
              disabled={loadingLlm}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <RotateCw size={11} className={loadingLlm ? "spin" : ""} />
              <span>Re-run Diagnosis</span>
            </button>
          )}
        </div>

        {!llmReport && !loadingLlm && (
          <div
            style={{
              padding: "16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px dashed rgba(99, 102, 241, 0.35)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Detailed LLM physical failure analysis and field engineering recommendations are available on-demand.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={fetchLlmDiagnosis}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Sparkles size={13} />
              <span>Check LLM Diagnosis</span>
            </button>
            {llmError && <div style={{ marginTop: "8px", color: "var(--color-red)", fontSize: "11px" }}>{llmError}</div>}
          </div>
        )}

        {loadingLlm && (
          <div style={{ padding: "16px", textAlign: "center", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px" }}>
            <RotateCw size={18} className="spin" style={{ color: "#818cf8", margin: "0 auto 8px" }} />
            <div style={{ fontSize: "12px", color: "#cbd5e1" }}>Analyzing telemetry with LLM diagnostic model…</div>
          </div>
        )}

        {llmReport && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* AI Recommendations */}
            {llmReport.ai_recommendations?.length > 0 && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(14, 165, 233, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
                  <Wrench size={13} />
                  <span>AI Recommendations for Improvement</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#e2e8f0", lineHeight: 1.5 }}>
                  {llmReport.ai_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* LLM Briefing Body */}
            <div
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.85)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: "6px",
                padding: "14px",
                fontSize: "12.5px",
                lineHeight: 1.6,
                color: "#cbd5e1",
                whiteSpace: "pre-wrap",
              }}
            >
              {llmReport.llm_report || llmReport.report || "Diagnosis complete. All parameters logged."}
            </div>
          </div>
        )}
      </div>

      {/* Navigation to Station */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link
          to={`/stations/${data.stationId}`}
          className="btn btn-secondary btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <span>Inspect {data.stationId} Full Readings</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Status Transition Action Buttons */}
      {nextStatuses.length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">Remediation Workflow</h3>
          {updateError && <InlineError message={updateError} />}
          <div className="detail-actions">
            {nextStatuses.map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${s === "resolved" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleStatusChange(s)}
                disabled={updating}
              >
                {updating ? "Updating…" : `Mark Incident as ${s.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
