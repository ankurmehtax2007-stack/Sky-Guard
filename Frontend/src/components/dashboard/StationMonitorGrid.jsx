import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRealtimeReadings } from "../../hooks/useRealtimeData";
import { StationMonitorCard } from "./StationMonitorCard";
import { ErrorState } from "../common/ErrorState";
import { SkeletonCard } from "../common/LoadingState";
import { getStationCity } from "../../utils/constants";
import { Search, Radio, MapPin, CheckCircle, AlertCircle } from "lucide-react";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(reading) {
  if (!reading?.timestamp) return false;
  return Date.now() - new Date(reading.timestamp).getTime() < ONLINE_THRESHOLD_MS;
}

export function StationMonitorGrid() {
  const { data: readings, loading, error, refetch, wsStatus } = useRealtimeReadings();
  const [filter, setFilter] = useState("all"); // all, normal, anomaly, offline
  const [search, setSearch] = useState("");

  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchId = (r.stationId || "").toLowerCase().includes(q);
        const city = getStationCity(r).toLowerCase();
        const matchCity = city.includes(q);
        if (!matchId && !matchCity) return false;
      }

      const online = isOnline(r);
      const isAnomaly = r.anomalyStatus === "detected" || r.anomalyStatus === "saved";

      if (filter === "normal") return online && !isAnomaly;
      if (filter === "anomaly") return isAnomaly;
      if (filter === "offline") return !online;
      return true;
    });
  }, [readings, filter, search]);

  // Group readings by City
  const groupedByCity = useMemo(() => {
    const groups = {};
    for (const r of filteredReadings) {
      const city = getStationCity(r);
      if (!groups[city]) groups[city] = [];
      groups[city].push(r);
    }
    return groups;
  }, [filteredReadings]);

  const cityEntries = Object.entries(groupedByCity);

  if (error) {
    return <ErrorState message={`Unable to load station data. ${error}`} onRetry={refetch} />;
  }

  if (loading && readings.length === 0) {
    return (
      <div>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-title-lg">Live Station Monitoring</span>
          </div>
        </div>
        <div className="station-monitor-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-title-lg">Live Station Monitoring</span>
          </div>
        </div>
        <div className="anomaly-alert-panel--empty">
          <Radio size={18} style={{ color: "var(--color-accent)" }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            Awaiting station telemetry data. Ensure simulator / MQTT ingestion pipeline is active.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div className="section-header-left">
          <span className="section-title-lg">Fleet Telemetry Matrix</span>
          <span className="section-count">{readings.length} Nodes</span>
          <span
            className={`live-dot ${
              wsStatus === "connected" ? "live-dot--pulse" : "live-dot--gray"
            }`}
            title={wsStatus === "connected" ? "Real-time updates active" : "Connecting…"}
          />
        </div>

        {/* Filter Pills & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search station or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-pill-group">
            <button
              className={`filter-pill ${filter === "all" ? "filter-pill--active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({readings.length})
            </button>
            <button
              className={`filter-pill ${filter === "anomaly" ? "filter-pill--active" : ""}`}
              onClick={() => setFilter("anomaly")}
            >
              Faults ({readings.filter((r) => r.anomalyStatus === "detected" || r.anomalyStatus === "saved").length})
            </button>
            <button
              className={`filter-pill ${filter === "normal" ? "filter-pill--active" : ""}`}
              onClick={() => setFilter("normal")}
            >
              Normal
            </button>
          </div>

          <Link to="/stations" className="card-link" style={{ marginLeft: "4px" }}>
            All Stations →
          </Link>
        </div>
      </div>

      {filteredReadings.length === 0 ? (
        <div className="anomaly-alert-panel--empty">
          <span>No stations match the selected filter.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {cityEntries.map(([city, cityReadings]) => {
            const hasFault = cityReadings.some(
              (r) => r.anomalyStatus === "detected" || r.anomalyStatus === "saved"
            );
            return (
              <div key={city} className="city-cluster-section">
                <div className="city-cluster-header">
                  <div className="city-cluster-header-left">
                    <MapPin size={15} style={{ color: "#38bdf8" }} />
                    <span className="city-cluster-name">{city} Cluster</span>
                    <span className="city-cluster-badge">
                      {cityReadings.length} {cityReadings.length === 1 ? "Station" : "Stations"}
                    </span>
                  </div>

                  <div className="city-cluster-status">
                    {hasFault ? (
                      <span style={{ color: "var(--color-red)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertCircle size={12} /> Fault Detected
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={12} /> All Nominal
                      </span>
                    )}
                  </div>
                </div>

                <div className="station-monitor-grid">
                  {cityReadings.map((reading) => (
                    <StationMonitorCard key={reading.stationId || reading._id} reading={reading} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
