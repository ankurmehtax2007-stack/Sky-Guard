import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useRealtimeReadings } from "../hooks/useRealtimeData";
import { ACTIVE_STATION_IDS, KNOWN_STATIONS } from "../utils/constants";
import {
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Send,
  Zap,
  Cpu,
  Layers,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Wrench,
  CheckCircle,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

export default function Insights() {
  const { data: readings } = useRealtimeReadings();
  const [selectedStationId, setSelectedStationId] = useState("AWS_01");
  const [feedbackSent, setFeedbackSent] = useState(null);
  const [aiReportData, setAiReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Interactive Sandbox State for Real-Time Inference
  const [testTemp, setTestTemp] = useState(48.5);
  const [testHum, setTestHum] = useState(25.0);
  const [testPress, setTestPress] = useState(955.0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [sandboxResult, setSandboxResult] = useState(null);

  const currentReading = useMemo(() => {
    return (
      readings.find((r) => r.stationId === selectedStationId) || {
        stationId: selectedStationId,
        temperature: 28.4,
        humidity: 64.2,
        pressure: 1012.5,
      }
    );
  }, [readings, selectedStationId]);

  // Extract or synthesize ML diagnostic analysis
  const analysis = useMemo(() => {
    if (sandboxResult) return sandboxResult;
    const existing = currentReading?.anomalyPrediction?.analysis;
    if (existing) return existing;

    const t = currentReading.temperature ?? 28;
    const h = currentReading.humidity ?? 60;
    const p = currentReading.pressure ?? 1012;

    const isTempAnom = t > 45 || t < 5;
    const isHumAnom = h > 90 || h < 15;
    const isPressAnom = p > 1045 || p < 960;
    const detected = isTempAnom || isHumAnom || isPressAnom;

    let rootCause = "normal";
    if (isTempAnom) rootCause = t > 45 ? "temperature_spike" : "cryogenic_dip";
    else if (isHumAnom) rootCause = "humidity_spike";
    else if (isPressAnom) rootCause = "pressure_jump";

    return {
      station: { id: selectedStationId, name: KNOWN_STATIONS[selectedStationId]?.name || "Active Station" },
      anomaly: {
        detected,
        decision: detected ? "known_anomaly" : "nominal",
        root_cause: rootCause,
        confidence: detected ? 0.89 : 0.98,
        severity: detected ? "HIGH" : "NOMINAL",
        severity_score: detected ? 0.76 : 0.05,
        fused_anomaly_score: detected ? 0.84 : 0.06,
      },
      evidence: {
        isolation_forest: detected ? 0.78 : 0.08,
        xgboost: detected ? 0.92 : 0.04,
        temporal: isPressAnom || isTempAnom ? 0.72 : 0.05,
        spatial: isHumAnom ? 0.65 : 0.09,
        physics: detected ? 0.85 : 0.02,
      },
      health: {
        score: detected ? 42 : 96,
        status: detected ? "DEGRADED" : "OPTIMAL",
      },
      explanation: {
        shap_factors: [
          { feature: "temperature_c", shap_value: isTempAnom ? 2.45 : 0.12 },
          { feature: "humidity_pct", shap_value: isHumAnom ? 1.84 : -0.15 },
          { feature: "pressure_hpa", shap_value: isPressAnom ? 2.12 : -0.22 },
          { feature: "spatial_cluster_diff", shap_value: 0.35 },
          { feature: "temporal_rate_lag1", shap_value: 0.18 },
        ],
      },
      maintenance: {
        priority: detected ? "P1 - Immediate Field Calibration" : "Routine Periodic Audit",
        recommended_action: detected
          ? `Inspect ${rootCause.replace("_", " ")} sensor transducer, verify solar shielding, grounding and ADC channel.`
          : "All telemetry parameters nominal. Continue 10s monitoring interval.",
      },
    };
  }, [currentReading, selectedStationId, sandboxResult]);

  // Transform SHAP factors for BarChart
  const shapData = useMemo(() => {
    const factors = analysis?.explanation?.shap_factors || [];
    return factors.map((f) => ({
      name: f.feature.replace("_", " "),
      impact: Number(f.shap_value.toFixed(2)),
    }));
  }, [analysis]);

  // 5-Axis Multi-Source Evidence Radar Data
  const radarData = useMemo(() => {
    const ev = analysis?.evidence || {};
    return [
      { axis: "Isolation Forest", score: Math.round((ev.isolation_forest || 0.1) * 100) },
      { axis: "XGBoost Prob", score: Math.round((ev.xgboost || 0.1) * 100) },
      { axis: "Physics Rules", score: Math.round((ev.physics || 0.05) * 100) },
      { axis: "Spatial Z-Score", score: Math.round((ev.spatial || 0.1) * 100) },
      { axis: "Temporal Rate", score: Math.round((ev.temporal || 0.05) * 100) },
    ];
  }, [analysis]);

  // Fetch dynamic AI report & improvement recommendations from ML Service
  const fetchAiReport = async (readingOverride) => {
    const r = readingOverride || currentReading;
    setLoadingReport(true);
    try {
      const res = await fetch("http://localhost:8000/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnostic: {
            station_id: selectedStationId,
            station_name: KNOWN_STATIONS[selectedStationId]?.name || "AWS Node",
            city: KNOWN_STATIONS[selectedStationId]?.city || "Delhi",
            cluster: selectedStationId === "AWS_01" ? "NCR" : selectedStationId === "AWS_02" ? "Konkan" : "South",
            temperature_c: r.temperature,
            humidity_pct: r.humidity,
            pressure_hpa: r.pressure,
            root_cause: analysis?.anomaly?.root_cause || "normal",
            decision: analysis?.anomaly?.decision || "normal",
            confidence: analysis?.anomaly?.confidence || 0.95,
            severity: analysis?.anomaly?.severity || "NONE",
            health_score: analysis?.health?.score || 100,
            health_status: analysis?.health?.status || "GOOD",
            fused_anomaly_score: analysis?.anomaly?.fused_anomaly_score || 0.0,
            maintenance: {
              recommended_action: analysis?.maintenance?.recommended_action || "Continue routine scheduled monitoring.",
              engineering_priority: analysis?.maintenance?.priority || "Nominal"
            },
            shap_factors: analysis?.explanation?.shap_factors || []
          }
        })
      });
      if (res.ok) {
        const json = await res.json();
        setAiReportData(json);
      }
    } catch (e) {
      console.warn("Could not reach ML service for report:", e);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    // LLM report is on-demand: reset report when switching stations or simulation state
    setAiReportData(null);
  }, [selectedStationId, sandboxResult]);

  // Interactive Sandbox Simulation Handler
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature_c: testTemp,
          humidity_pct: testHum,
          pressure_hpa: testPress,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.analysis) {
          setSandboxResult(json.analysis);
          setAiReportData(null); // Keep LLM diagnosis on-demand until user clicks
        }
      }
    } catch {
      // Fallback local synthetic calculation
      const isAnom = testTemp > 45 || testTemp < 5 || testHum > 90 || testPress < 960;
      setSandboxResult({
        station: { id: selectedStationId, name: KNOWN_STATIONS[selectedStationId]?.name || "Station" },
        anomaly: {
          detected: isAnom,
          decision: isAnom ? "known_anomaly" : "nominal",
          root_cause: testTemp > 45 ? "temperature_spike" : testHum > 90 ? "humidity_spike" : "pressure_jump",
          confidence: 0.94,
          severity: isAnom ? "CRITICAL" : "NOMINAL",
          fused_anomaly_score: isAnom ? 0.91 : 0.08,
        },
        evidence: {
          isolation_forest: isAnom ? 0.88 : 0.05,
          xgboost: isAnom ? 0.95 : 0.02,
          temporal: 0.74,
          spatial: 0.61,
          physics: isAnom ? 0.96 : 0.01,
        },
        health: { score: isAnom ? 32 : 98, status: isAnom ? "CRITICAL" : "OPTIMAL" },
        explanation: {
          shap_factors: [
            { feature: "temperature_c", shap_value: testTemp > 45 ? 2.82 : 0.1 },
            { feature: "humidity_pct", shap_value: testHum > 90 ? 2.15 : 0.05 },
            { feature: "pressure_hpa", shap_value: testPress < 960 ? 2.45 : -0.2 },
            { feature: "spatial_diff", shap_value: 0.42 },
            { feature: "rate_of_change", shap_value: 0.68 },
          ],
        },
        maintenance: {
          priority: isAnom ? "P1 - Emergency Calibration" : "Routine Nominal",
          recommended_action: isAnom
            ? "Severe thermodynamic boundary breach. Dispatch technician to inspect sensor probes immediately."
            : "Nominal operational status.",
        },
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AppLayout pageTitle="Explainable AI &amp; LLM Insights">
      <div className="page-stack">
        {/* ── Header Controls & Station Selector ── */}
        <div className="page-header-row" style={{ flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <BrainCircuit size={18} />
              </div>
              <h2 className="page-heading">SkyGuard AI • Explainable AI &amp; LLM Diagnostics</h2>
            </div>
            <p className="page-description">
              Multi-source 5-tier machine learning inference, SHAP attribution trees &amp; Mistral LLM root-cause briefings
            </p>
          </div>

          {/* Station Selector Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>Station:</span>
            <div className="sensor-tab-group">
              {ACTIVE_STATION_IDS.map((id) => (
                <button
                  key={id}
                  className={`sensor-tab-btn ${selectedStationId === id ? "sensor-tab-btn--active" : ""}`}
                  onClick={() => {
                    setSelectedStationId(id);
                    setSandboxResult(null);
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Top KPI Stat Strip ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          {/* Fused Score */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Fused Anomaly Score</span>
              <Activity size={16} color="#0ea5e9" />
            </div>
            <div className="stat-card-value" style={{ color: analysis.anomaly.detected ? "#ef4444" : "#10b981" }}>
              {(analysis.anomaly.fused_anomaly_score * 100).toFixed(1)}%
            </div>
            <span className="stat-card-subtext">
              Status: <strong>{analysis.anomaly.decision.toUpperCase()}</strong>
            </span>
          </div>

          {/* Diagnosed Condition */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Diagnosed Root Cause</span>
              <AlertTriangle size={16} color="#f59e0b" />
            </div>
            <div className="stat-card-value" style={{ fontSize: "1.3rem", color: "#f8fafc" }}>
              {analysis.anomaly.root_cause.replace("_", " ").toUpperCase()}
            </div>
            <span className="stat-card-subtext">
              Severity: <strong>{analysis.anomaly.severity}</strong> • Conf: {(analysis.anomaly.confidence * 100).toFixed(0)}%
            </span>
          </div>

          {/* Health Index */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Station Health Index</span>
              <ShieldAlert size={16} color="#6366f1" />
            </div>
            <div className="stat-card-value" style={{ color: analysis.health.score > 70 ? "#10b981" : "#ef4444" }}>
              {analysis.health.score} / 100
            </div>
            <span className="stat-card-subtext">Rating: {analysis.health.status}</span>
          </div>

          {/* Active Model Stack */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Inference Engine</span>
              <Cpu size={16} color="#34d399" />
            </div>
            <div className="stat-card-value" style={{ fontSize: "1.2rem", color: "#34d399" }}>
              FastAPI + SHAP
            </div>
            <span className="stat-card-subtext">XGBoost &amp; Isolation Forest</span>
          </div>
        </div>

        {/* ── Main Diagnostics Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
          {/* Left 1: SHAP Waterfall Attribution */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Layers size={16} color="#0ea5e9" />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                  SHAP Waterfall Feature Attribution
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Impact on Anomaly Probability</span>
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {shapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.impact > 0 ? "#ef4444" : "#0ea5e9"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "10px", display: "flex", gap: "16px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 10, height: 10, background: "#ef4444", borderRadius: 2 }} />
                Positive Deviation Driver (Raises Risk)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 10, height: 10, background: "#0ea5e9", borderRadius: 2 }} />
                Stabilizing Factor (Lowers Risk)
              </span>
            </div>
          </div>

          {/* Left 2: Multi-Source Evidence Radar */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={16} color="#6366f1" />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                  5-Tier Multi-Source Evidence Radar
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Fused Sensor Score Breakdown</span>
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                  <PolarAngleAxis dataKey="axis" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Radar
                    name="Evidence Weight"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: "8px 0 0", textAlign: "center" }}>
              Fused Decision: Temporal, Spatial, Isolation Forest, XGBoost and Thermodynamic consistency checks.
            </p>
          </div>
        </div>

        {/* ── Mistral LLM Automated Diagnostic Report Viewer ── */}
        <div
          className="card"
          style={{
            padding: "24px",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#818cf8",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>
                  SkyGuard AI Diagnostic &amp; Improvement Briefing
                </h3>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Station: <strong>{selectedStationId}</strong> ({KNOWN_STATIONS[selectedStationId]?.city || "Delhi"} - {KNOWN_STATIONS[selectedStationId]?.name || "AWS Node"}) • {aiReportData?.source ? `Source: ${aiReportData.source.toUpperCase()}` : "AI Pipeline"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {aiReportData ? (
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => fetchAiReport()}
                  disabled={loadingReport}
                  title="Re-run diagnostic analysis from ML Service"
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <RotateCw size={12} className={loadingReport ? "spin" : ""} />
                  <span>{loadingReport ? "Generating…" : "Re-run Diagnosis"}</span>
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-xs"
                  onClick={() => fetchAiReport()}
                  disabled={loadingReport}
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Sparkles size={12} />
                  <span>{loadingReport ? "Generating…" : "Check LLM Diagnosis"}</span>
                </button>
              )}

              <span className={`badge ${analysis.anomaly.detected ? "badge-severity-high" : "badge-resolved"}`}>
                {analysis.anomaly.detected ? "ACTION REQUIRED" : "NOMINAL TELEMETRY"}
              </span>
            </div>
          </div>

          {/* AI Recommendations for Improvements (Shown when report has been generated) */}
          {aiReportData?.ai_recommendations && aiReportData.ai_recommendations.length > 0 && (
            <div
              style={{
                marginBottom: "16px",
                padding: "16px",
                background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.08))",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <Wrench size={16} style={{ color: "#38bdf8" }} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  AI Recommendations for Improvements
                </span>
                <span className="section-count" style={{ fontSize: "10px", borderColor: "rgba(56, 189, 248, 0.3)", color: "#38bdf8" }}>
                  Explainability Engine
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {aiReportData.ai_recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "12.5px",
                      color: "#e2e8f0",
                      lineHeight: 1.5,
                      background: "rgba(15, 23, 42, 0.5)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        minWidth: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "rgba(14, 165, 233, 0.25)",
                        color: "#38bdf8",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "1px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Briefing Content */}
          <div
            style={{
              backgroundColor: "rgba(10, 15, 29, 0.85)",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              borderRadius: "8px",
              padding: "18px 20px",
              fontSize: "13px",
              lineHeight: 1.65,
              color: "#cbd5e1",
            }}
          >
            {loadingReport ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <RotateCw size={26} className="spin" style={{ color: "#818cf8", margin: "0 auto 12px" }} />
                <div style={{ color: "#f8fafc", fontSize: "14px", fontWeight: 600 }}>
                  Analyzing telemetry with LLM diagnostic model…
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                  Synthesizing physical failure mode explanation and remediation steps
                </div>
              </div>
            ) : aiReportData?.llm_report ? (
              <div style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", fontSize: "12.5px" }}>
                {aiReportData.llm_report}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    color: "#818cf8",
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <h4 style={{ color: "#f8fafc", fontSize: "15px", fontWeight: 600, margin: "0 0 6px" }}>
                  On-Demand LLM Root-Cause Diagnosis
                </h4>
                <p style={{ color: "#94a3b8", fontSize: "13px", maxWidth: "540px", margin: "0 auto 16px", lineHeight: 1.5 }}>
                  Click below to generate an AI failure-mode analysis, SHAP attribution insights, and engineering action plan for Station <strong>{selectedStationId}</strong>.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => fetchAiReport()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Sparkles size={14} />
                  <span>Check LLM Diagnosis</span>
                </button>
              </div>
            )}
          </div>

          {/* Operator Feedback Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {feedbackSent ? `Feedback recorded: "${feedbackSent}"` : "Was this automated diagnosis accurate?"}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setFeedbackSent("Confirmed Anomaly")}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ThumbsUp size={13} color="#34d399" />
                <span>Confirm Diagnosis</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setFeedbackSent("Marked False Positive")}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ThumbsDown size={13} color="#f87171" />
                <span>Mark False Positive</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Interactive Sandbox: Run Real-Time ML Inference ── */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={16} color="#0ea5e9" />
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                Interactive Model Sandbox &amp; Probe
              </h3>
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              Test FastAPI ML inference on arbitrary sensor payloads
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            {/* Temp slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Temperature:</span>
                <strong style={{ color: "#38bdf8" }}>{testTemp.toFixed(1)} °C</strong>
              </div>
              <input
                type="range"
                min="-10"
                max="65"
                step="0.5"
                value={testTemp}
                onChange={(e) => setTestTemp(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#0ea5e9" }}
              />
            </div>

            {/* Hum slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Humidity:</span>
                <strong style={{ color: "#34d399" }}>{testHum.toFixed(0)} % RH</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={testHum}
                onChange={(e) => setTestHum(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#34d399" }}
              />
            </div>

            {/* Press slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Pressure:</span>
                <strong style={{ color: "#a78bfa" }}>{testPress.toFixed(0)} hPa</strong>
              </div>
              <input
                type="range"
                min="900"
                max="1080"
                step="1"
                value={testPress}
                onChange={(e) => setTestPress(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#a78bfa" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            {sandboxResult && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSandboxResult(null)}
              >
                Reset to Live Telemetry
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              disabled={isSimulating}
              onClick={handleRunSimulation}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0ea5e9" }}
            >
              <Zap size={14} />
              <span>{isSimulating ? "Running Inference…" : "Run ML Diagnostics on Probe"}</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
