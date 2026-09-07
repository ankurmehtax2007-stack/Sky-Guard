import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useRealtimeReadings } from "../../hooks/useRealtimeData";
import { useAnomalies } from "../../hooks/useAnomalies";
import { KNOWN_STATIONS } from "../../utils/constants";
import {
  Compass,
  Layers,
  MapPin,
  Radio,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Activity,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  CheckCircle2,
} from "lucide-react";

// Geographic coordinates projected accurately on the official 1000x1000 India map
const STATION_NODES = {
  AWS_01: {
    id: "AWS_01",
    name: "Delhi NCR Observational Hub",
    region: "Indo-Gangetic Alluvial Basin",
    coordinates: "28.6139° N, 77.2090° E",
    x: 344.1,
    y: 320.0,
    lithology: "Quaternary Alluvial Silts, Micaceous Sand & Clay",
    strataDepth: "1.2 km alluvial sediment over Proterozoic basement",
    elevation: "216 m ASL",
    status: "Active Telemetry Hub",
  },
  AWS_02: {
    id: "AWS_02",
    name: "Mumbai Coastal Radar Node",
    region: "Konkan / Western Deccan Traps",
    coordinates: "19.0760° N, 72.8777° E",
    x: 242.0,
    y: 585.0,
    lithology: "Tholeiitic Flood Basalt & Intertrappean Volcanics",
    strataDepth: "Deccan Volcanic Province, Cretaceous-Paleogene boundary",
    elevation: "14 m ASL",
    status: "Active Telemetry Hub",
  },
  AWS_03: {
    id: "AWS_03",
    name: "Bengaluru Cratonic Observatory",
    region: "Dharwar Craton / South Shield",
    coordinates: "12.9716° N, 77.5946° E",
    x: 355.0,
    y: 770.0,
    lithology: "Peninsular Gneissic Complex & Archean Greenstone",
    strataDepth: "3.4 Ga Ancient Continental Crustal Shield",
    elevation: "920 m ASL",
    status: "Active Telemetry Hub",
  },
};

export function LithosIndiaMapHero() {
  const { data: readings } = useRealtimeReadings();
  const { data: anomalies } = useAnomalies();
  const [selectedStationId, setSelectedStationId] = useState("AWS_01");
  const [activeLayer, setActiveLayer] = useState("all"); // all | stations | geology | radar
  const [cursorPos, setCursorPos] = useState({ x: 400, y: 450 });
  const mapContainerRef = useRef(null);

  const selectedNode = STATION_NODES[selectedStationId] || STATION_NODES.AWS_01;
  const currentReading = readings.find((r) => r.stationId === selectedStationId);

  // Check if selected station has active anomaly
  const hasAnomaly =
    (currentReading?.anomalyStatus && currentReading.anomalyStatus !== "none") ||
    (currentReading?.anomalyPrediction?.isAnomaly) ||
    anomalies.some((a) => a.stationId === selectedStationId && a.status === "pending");

  // Track cursor position inside map for dynamic spotlight
  const handleMouseMove = (e) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#060913",
        color: "#f1f5f9",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Lithos Top Navigation Bar ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
          backgroundColor: "rgba(10, 15, 29, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 256 256" fill="#e8702a">
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
            </svg>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span className="font-playfair" style={{ color: "#ffffff", fontSize: "1.4rem", fontStyle: "italic", fontWeight: 600 }}>
                  Lithos
                </span>
                <span style={{ fontSize: "11px", color: "#e8702a", fontWeight: 700, letterSpacing: "0.1em" }}>
                  RADAR
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                India Automated Weather &amp; Geological Telemetry Grid
              </div>
            </div>
          </Link>
        </div>

        {/* Center Pill Menu for Layer Toggles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "9999px",
            padding: "4px 6px",
          }}
        >
          <button
            className={`sensor-tab-btn ${activeLayer === "all" ? "sensor-tab-btn--active" : ""}`}
            onClick={() => setActiveLayer("all")}
          >
            Integrated View
          </button>
          <button
            className={`sensor-tab-btn ${activeLayer === "stations" ? "sensor-tab-btn--active" : ""}`}
            onClick={() => setActiveLayer("stations")}
          >
            AWS Stations
          </button>
          <button
            className={`sensor-tab-btn ${activeLayer === "geology" ? "sensor-tab-btn--active" : ""}`}
            onClick={() => setActiveLayer("geology")}
          >
            Geological Strata
          </button>
          <button
            className={`sensor-tab-btn ${activeLayer === "radar" ? "sensor-tab-btn--active" : ""}`}
            onClick={() => setActiveLayer("radar")}
          >
            Doppler Pulses
          </button>
        </div>

        {/* Right Action Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span>Dashboard</span>
            <ArrowUpRight size={13} />
          </Link>
          <Link to="/anomalies" className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#e8702a", borderColor: "#e8702a" }}>
            <AlertTriangle size={13} />
            <span>Anomalies ({anomalies.filter((a) => a.status === "pending").length})</span>
          </Link>
        </div>
      </header>

      {/* ── Main Map & Telemetry Dashboard Stage ── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left: Full-Screen Interactive Vector India Map */}
        <div
          ref={mapContainerRef}
          onMouseMove={handleMouseMove}
          style={{
            position: "relative",
            backgroundColor: "#050811",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "20px",
          }}
        >
          {/* Subtle Geological Grid Pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)",
              backgroundSize: "40px 40px",
              pointerEvents: "none",
            }}
          />

          {/* Dynamic Spotlight Glow under Cursor */}
          <div
            style={{
              position: "absolute",
              width: "480px",
              height: "480px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(232, 112, 42, 0.12) 0%, rgba(14, 165, 233, 0.05) 45%, transparent 70%)",
              transform: `translate(${cursorPos.x - 240}px, ${cursorPos.y - 240}px)`,
              pointerEvents: "none",
              transition: "transform 0.08s ease-out",
              zIndex: 1,
            }}
          />

          {/* Floating Map Legend Overlay */}
          <div
            style={{
              position: "absolute",
              top: "24px",
              left: "24px",
              backgroundColor: "rgba(13, 19, 34, 0.8)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: "10px",
              padding: "12px 16px",
              zIndex: 10,
              maxWidth: "240px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#e8702a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Lithosphere Radar
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", marginTop: "2px" }}>
              India Station Fleet
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ea5e9" }} />
                <span>Nominal Station (Normal)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                <span>Fault Anomaly Detected</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 14, height: 2, background: "#e8702a", opacity: 0.7 }} />
                <span>Tectonic Lineament</span>
              </div>
            </div>
          </div>

          {/* SVG Map of India with 100% Accurate Real Boundaries */}
          <svg
            viewBox="0 0 1000 1000"
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "88vh",
              filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.9))",
              zIndex: 2,
            }}
          >
            <defs>
              <linearGradient id="lithosIndiaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#111827" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#080e1a" stopOpacity="0.98" />
              </linearGradient>

              <radialGradient id="dopplerPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e8702a" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Authentic Vector India Map with Full Coastlines & State Boundaries */}
            <image
              href="/india.svg"
              x="0"
              y="0"
              width="1000"
              height="1000"
              style={{
                filter: "brightness(0.9) contrast(1.1)",
              }}
            />

            {/* Geological Fault Lines & Stratification (Lithos Signature) */}
            {(activeLayer === "all" || activeLayer === "geology") && (
              <g stroke="rgba(232, 112, 42, 0.55)" strokeWidth="2.5" strokeDasharray="6 6" fill="none">
                {/* Indo-Gangetic Basin Boundary */}
                <path d="M 280 290 Q 440 370 650 430" />
                {/* Central Narmada-Son Tectonic Lineament */}
                <path d="M 210 500 Q 380 510 570 510" />
                {/* Western Ghats Escarpment & Basalt Ridge */}
                <path d="M 240 560 Q 280 720 340 870" />
                {/* Eastern Ghats Granulite Belt */}
                <path d="M 520 540 Q 480 660 410 820" />
              </g>
            )}

            {/* Geological Regions Labels */}
            {activeLayer === "geology" && (
              <g fill="rgba(232, 112, 42, 0.75)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                <text x="360" y="360">INDO-GANGETIC ALLUVIUM</text>
                <text x="310" y="530">DECCAN VOLCANIC TRAPS</text>
                <text x="330" y="730">DHARWAR CRATON</text>
              </g>
            )}

            {/* Station Nodes & Interactive Markers */}
            {Object.values(STATION_NODES).map((node) => {
              const isSelected = selectedStationId === node.id;
              const stReading = readings.find((r) => r.stationId === node.id);
              const isFault =
                (stReading?.anomalyStatus && stReading.anomalyStatus !== "none") ||
                (stReading?.anomalyPrediction?.isAnomaly) ||
                anomalies.some((a) => a.stationId === node.id && a.status === "pending");

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedStationId(node.id)}
                >
                  {/* Outer Pulsing Doppler Ring */}
                  {(activeLayer === "all" || activeLayer === "radar" || isSelected) && (
                    <circle
                      r={isSelected ? "44" : "32"}
                      fill="none"
                      stroke={isFault ? "#ef4444" : isSelected ? "#e8702a" : "#0ea5e9"}
                      strokeWidth="2.5"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="r"
                        from="12"
                        to={isSelected ? "55" : "42"}
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Core Station Marker */}
                  <circle
                    r={isSelected ? "14" : "10"}
                    fill={isFault ? "#ef4444" : isSelected ? "#e8702a" : "#0ea5e9"}
                    stroke="#ffffff"
                    strokeWidth="3"
                    style={{
                      filter: `drop-shadow(0 0 14px ${isFault ? "#ef4444" : isSelected ? "#e8702a" : "#0ea5e9"})`,
                    }}
                  />

                  {/* Station Label Chip */}
                  <g transform="translate(20, -8)">
                    <rect
                      x="0"
                      y="-16"
                      width="96"
                      height="26"
                      rx="6"
                      fill="rgba(8, 14, 28, 0.92)"
                      stroke={isSelected ? "#e8702a" : "rgba(148, 163, 184, 0.3)"}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                    <text
                      x="10"
                      y="2"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {node.id}
                    </text>
                    {isFault && (
                      <circle cx="82" cy="-3" r="4" fill="#ef4444">
                        <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Selected Station Telemetry & Crustal Dossier */}
        <div
          style={{
            backgroundColor: "#0a0f1d",
            borderLeft: "1px solid rgba(148, 163, 184, 0.12)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          {/* Header of Dossier */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Radio size={14} color="#e8702a" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#e8702a", fontWeight: 700 }}>
                  STATION DOSSIER
                </span>
              </div>
              <span className={`badge ${hasAnomaly ? "badge-severity-critical" : "badge-resolved"}`}>
                {hasAnomaly ? "ANOMALY DETECTED" : "NOMINAL"}
              </span>
            </div>

            <h2 style={{ fontSize: "22px", color: "#ffffff", margin: "8px 0 2px", fontWeight: 700 }}>
              {selectedNode.id}
            </h2>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              {selectedNode.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {selectedNode.coordinates} • {selectedNode.elevation}
            </div>
          </div>

          {/* Geological Crust Stratification Card */}
          <div
            style={{
              backgroundColor: "rgba(232, 112, 42, 0.08)",
              border: "1px solid rgba(232, 112, 42, 0.25)",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#e8702a", fontWeight: 600, fontSize: "12px" }}>
              <Layers size={14} />
              <span>Crustal Geology &amp; Lithology</span>
            </div>
            <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "8px 0 4px", lineHeight: 1.5, fontWeight: 500 }}>
              {selectedNode.lithology}
            </p>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {selectedNode.strataDepth}
            </span>
          </div>

          {/* Live Sensor Telemetry Gauges */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Live Telemetry Stream
            </span>

            {/* Temperature */}
            <div className="stat-item" style={{ background: "rgba(15, 23, 42, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-item-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Thermometer size={13} color="#38bdf8" />
                  Temperature
                </span>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Range: -10 to 50°C</span>
              </div>
              <span className="stat-item-value" style={{ color: "#38bdf8" }}>
                {currentReading?.temperature !== undefined ? `${currentReading.temperature.toFixed(1)} °C` : "28.4 °C"}
              </span>
            </div>

            {/* Humidity */}
            <div className="stat-item" style={{ background: "rgba(15, 23, 42, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-item-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Droplets size={13} color="#34d399" />
                  Humidity
                </span>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Range: 10 to 95%</span>
              </div>
              <span className="stat-item-value" style={{ color: "#34d399" }}>
                {currentReading?.humidity !== undefined ? `${currentReading.humidity.toFixed(0)} % RH` : "64 %"}
              </span>
            </div>

            {/* Pressure */}
            <div className="stat-item" style={{ background: "rgba(15, 23, 42, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-item-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Gauge size={13} color="#a78bfa" />
                  Barometric Pressure
                </span>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Range: 900 to 1050 hPa</span>
              </div>
              <span className="stat-item-value" style={{ color: "#a78bfa" }}>
                {currentReading?.pressure !== undefined ? `${currentReading.pressure.toFixed(0)} hPa` : "1012 hPa"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px" }}>
            <Link
              to={`/stations/${selectedNode.id}`}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", backgroundColor: "#e8702a", borderColor: "#e8702a" }}
            >
              <span>Inspect {selectedNode.id} Telemetry Curves</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link
              to="/anomalies"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>View Anomaly Incident Log</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LithosIndiaMapHero;
