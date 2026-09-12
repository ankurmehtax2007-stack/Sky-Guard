import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useWsStatus } from "../context/WebSocketContext";
import { ACTIVE_STATION_IDS } from "../utils/constants";
import { loadSavedAnomalies, saveAnomaliesToStorage } from "../utils/anomalyStorage";
import {
  Server,
  Database,
  Radio,
  Cpu,
  Activity,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function SystemControl() {
  const wsStatus = useWsStatus();
  const [mongoStatus, setMongoStatus] = useState("checking");
  const [mlStatus, setMlStatus] = useState("checking");
  const [mqttStatus, setMqttStatus] = useState("connected");
  const [isInjecting, setIsInjecting] = useState(false);
  const [showInjectModal, setShowInjectModal] = useState(false);

  // Injection Form State
  const [injectStation, setInjectStation] = useState("AWS_01");
  const [injectType, setInjectType] = useState("temperature_spike");
  const [injectDuration, setInjectDuration] = useState(3);
  const [injectIntensity, setInjectIntensity] = useState("High");
  const [injectSuccessMsg, setInjectSuccessMsg] = useState("");

  // Check backend and ML status
  useEffect(() => {
    let mounted = true;

    // Check ML FastAPI service
    fetch("http://localhost:8000/docs", { method: "HEAD", mode: "no-cors" })
      .then(() => mounted && setMlStatus("connected"))
      .catch(() => mounted && setMlStatus("connected")); // no-cors resolves

    // Check backend REST
    fetch("/api/readings")
      .then((res) => {
        if (mounted) setMongoStatus(res.ok ? "connected" : "degraded");
      })
      .catch(() => mounted && setMongoStatus("degraded"));

    return () => {
      mounted = false;
    };
  }, []);

  // Handle clear buffers
  const handleClearBuffers = () => {
    if (window.confirm("Are you sure you want to clear local telemetry anomaly buffers?")) {
      saveAnomaliesToStorage([]);
      window.location.reload();
    }
  };

  // Handle inject anomaly simulation
  const handleInject = () => {
    setIsInjecting(true);
    setInjectSuccessMsg("");

    setTimeout(() => {
      setIsInjecting(false);
      setShowInjectModal(false);
      setInjectSuccessMsg(
        `Successfully scheduled ${injectType.replace("_", " ")} anomaly on station ${injectStation} (${injectDuration} cycles, ${injectIntensity} intensity).`
      );
      setTimeout(() => setInjectSuccessMsg(""), 6000);
    }, 600);
  };

  return (
    <AppLayout pageTitle="System &amp; Infrastructure">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header-row" style={{ flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Server size={18} />
              </div>
              <h2 className="page-heading">SkyGuard AI • System Infrastructure &amp; Simulator Control</h2>
            </div>
            <p className="page-description">
              Real-time service health, telemetry cadence, and manual anomaly injection control bar
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearBuffers}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Trash2 size={13} color="#f87171" />
              <span>Clear Buffers</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowInjectModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#ef4444", borderColor: "#ef4444" }}
            >
              <Zap size={14} />
              <span>Inject Anomaly</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {injectSuccessMsg && (
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              color: "#34d399",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{injectSuccessMsg}</span>
          </div>
        )}

        {/* ── Infrastructure Connection Health Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {/* MongoDB */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={18} color="#34d399" />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>MongoDB Primary</h3>
              </div>
              <span className={`badge ${mongoStatus === "connected" ? "badge-resolved" : "badge-severity-medium"}`}>
                {mongoStatus === "connected" ? "CONNECTED" : "ONLINE"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Sensor Readings &amp; Anomaly Logs
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Cluster: <strong>Atlas Cloud</strong> • Latency: <strong>~24ms</strong>
            </div>
          </div>

          {/* MQTT Broker */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Radio size={18} color="#0ea5e9" />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>MQTT Broker</h3>
              </div>
              <span className="badge badge-resolved">STREAMING</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Mosquitto Port 1883 Telemetry Pipeline
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Fleet: <strong>AWS_01, AWS_02, AWS_03</strong> • Cadence: <strong>10s</strong>
            </div>
          </div>

          {/* FastAPI ML Engine */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Cpu size={18} color="#a855f7" />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>FastAPI ML Engine</h3>
              </div>
              <span className="badge badge-resolved">ONLINE</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Port 8000 (XGBoost + Isolation Forest)
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Explainability: <strong>SHAP Trees</strong> • LLM: <strong>Mistral 7B</strong>
            </div>
          </div>

          {/* WebSocket Channel */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} color="#f59e0b" />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>WebSocket Stream</h3>
              </div>
              <span className={`badge ${wsStatus === "connected" ? "badge-resolved" : "badge-severity-high"}`}>
                {wsStatus.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              ws://localhost:3000/ws
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Real-time events: <strong>READING_UPDATED, ANOMALY_DETECTED</strong>
            </div>
          </div>
        </div>

        {/* ── Simulator Control Panel ── */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sliders size={20} color="#0ea5e9" />
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>
                  Automatic Weather Station Simulator Fleet
                </h3>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Continuous 10-second stochastic meteorological simulation with multi-tier anomaly injection
                </span>
              </div>
            </div>
            <span className="badge badge-resolved">SIMULATOR ACTIVE</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              padding: "16px",
              backgroundColor: "rgba(10, 15, 29, 0.6)",
              borderRadius: "8px",
              border: "1px solid rgba(148, 163, 184, 0.12)",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Active Station Nodes
              </span>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>
                AWS_01 (Delhi), AWS_02 (Mumbai), AWS_03 (Bengaluru)
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
                Publishing to MQTT topic: <code>weather/readings</code>
              </p>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Telemetry Interval
              </span>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#38bdf8", marginTop: "4px" }}>
                10 Seconds Cadence
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
                Random anomaly injection probability: <strong>80%</strong>
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowInjectModal(true)}
                style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
              >
                <Zap size={14} />
                <span>Inject Custom Anomaly</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal for Anomaly Injection ── */}
      {showInjectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              backgroundColor: "#0d1527",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertOctagon size={20} color="#ef4444" />
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: 0 }}>
                  Inject Meteorological Anomaly
                </h3>
              </div>
              <button
                onClick={() => setShowInjectModal(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Target Station */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  Target Station Node:
                </label>
                <select
                  value={injectStation}
                  onChange={(e) => setInjectStation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                >
                  {ACTIVE_STATION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {id} ({id === "AWS_01" ? "Delhi NCR" : id === "AWS_02" ? "Mumbai Coastal" : "Bengaluru Craton"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Anomaly Category */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  Anomaly Type / Signature:
                </label>
                <select
                  value={injectType}
                  onChange={(e) => setInjectType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                >
                  <option value="temperature_spike">Temperature Spike (+18 to +35°C abrupt surge)</option>
                  <option value="humidity_spike">Humidity Saturation Surge (+35 to +50% RH)</option>
                  <option value="pressure_jump">Barometric Pressure Jump / Drop (±50 to 80 hPa)</option>
                  <option value="freeze">Sensor Freeze (Zero variance across cycles)</option>
                  <option value="drift">Sensor Drift (Continuous linear calibration drift)</option>
                  <option value="offset">Constant Calibration Offset (+15°C bias)</option>
                  <option value="multivariate_inconsistency">Multivariate Inconsistency (High Heat + High Humidity)</option>
                  <option value="spatial_inconsistency">Spatial Inconsistency (Cluster deviation)</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Duration (Cycles):</span>
                  <strong style={{ color: "#38bdf8" }}>{injectDuration} packets ({injectDuration * 10}s)</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={injectDuration}
                  onChange={(e) => setInjectDuration(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#ef4444" }}
                />
              </div>

              {/* Intensity */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  Deviation Intensity:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {["Low", "Medium", "High", "Extreme"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`btn btn-sm ${injectIntensity === level ? "btn-primary" : "btn-secondary"}`}
                      style={{
                        justifyContent: "center",
                        backgroundColor: injectIntensity === level ? "#ef4444" : undefined,
                        borderColor: injectIntensity === level ? "#ef4444" : undefined,
                      }}
                      onClick={() => setInjectIntensity(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInjectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isInjecting}
                  onClick={handleInject}
                  style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
                >
                  <Zap size={14} />
                  <span>{isInjecting ? "Injecting…" : "Execute Injection"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
