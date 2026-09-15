import { useState, useMemo } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { StationTable } from "../components/stations/StationTable";
import { StationMonitorCard } from "../components/dashboard/StationMonitorCard";
import { useRealtimeReadings } from "../hooks/useRealtimeData";
import { ErrorState } from "../components/common/ErrorState";
import { TableSkeleton } from "../components/common/LoadingState";
import { getStationCity } from "../utils/constants";
import { LayoutGrid, List, Search, Radio, MapPin, AlertCircle, CheckCircle } from "lucide-react";

export default function Stations() {
  const { data: readings, loading, error, refetch, wsStatus } = useRealtimeReadings();
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  // Extract all distinct cities from current readings
  const availableCities = useMemo(() => {
    const set = new Set();
    readings.forEach((r) => {
      const c = getStationCity(r);
      if (c) set.add(c);
    });
    if (set.size === 0) {
      ["Delhi", "Mumbai", "Bengaluru"].forEach((c) => set.add(c));
    }
    return Array.from(set);
  }, [readings]);

  const filtered = useMemo(() => {
    return readings.filter((r) => {
      const city = getStationCity(r);
      if (selectedCity !== "all" && city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchId = (r.stationId || "").toLowerCase().includes(q);
        const matchCity = city.toLowerCase().includes(q);
        if (!matchId && !matchCity) return false;
      }
      return true;
    });
  }, [readings, search, selectedCity]);

  // Group filtered stations by City
  const groupedByCity = useMemo(() => {
    const groups = {};
    for (const r of filtered) {
      const city = getStationCity(r);
      if (!groups[city]) groups[city] = [];
      groups[city].push(r);
    }
    return groups;
  }, [filtered]);

  const cityEntries = Object.entries(groupedByCity);

  return (
    <AppLayout pageTitle="Weather Stations Fleet">
      <div className="page-stack">
        <div className="page-header-row" style={{ flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 className="page-heading">Automatic Weather Station (AWS) Fleet</h2>
              <span
                className={`live-dot ${wsStatus === "connected" ? "live-dot--pulse" : "live-dot--gray"}`}
                title={`Live telemetry: ${wsStatus}`}
              />
            </div>
            <p className="page-description">
              {!loading && !error && readings.length > 0
                ? `${readings.length} ground monitoring stations grouped across ${availableCities.length} regional city clusters`
                : "Real-time AWS network status and live sensor feeds"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                className="search-bar-input"
                placeholder="Find station or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View Switcher */}
            <div className="sensor-tab-group">
              <button
                className={`sensor-tab-btn ${viewMode === "grid" ? "sensor-tab-btn--active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid visual view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                className={`sensor-tab-btn ${viewMode === "table" ? "sensor-tab-btn--active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* City Filter Tabs */}
        {availableCities.length > 0 && (
          <div className="filter-pill-group" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
            <button
              className={`filter-pill ${selectedCity === "all" ? "filter-pill--active" : ""}`}
              onClick={() => setSelectedCity("all")}
            >
              All Cities ({readings.length})
            </button>
            {availableCities.map((city) => {
              const cityCount = readings.filter((r) => getStationCity(r) === city).length;
              return (
                <button
                  key={city}
                  className={`filter-pill ${selectedCity === city ? "filter-pill--active" : ""}`}
                  onClick={() => setSelectedCity(city)}
                >
                  <MapPin size={11} style={{ marginRight: "3px" }} />
                  {city} ({cityCount})
                </button>
              );
            })}
          </div>
        )}

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading && readings.length === 0 ? (
          <div className="card" style={{ padding: "var(--space-6)" }}>
            <TableSkeleton rows={4} cols={6} />
          </div>
        ) : readings.length === 0 ? (
          <div className="anomaly-alert-panel--empty">
            <Radio size={18} style={{ color: "var(--color-accent)" }} />
            <span>No stations currently reporting telemetry. Verify backend and MQTT simulator are running.</span>
          </div>
        ) : cityEntries.length === 0 ? (
          <div className="anomaly-alert-panel--empty">
            <span>No stations match the search filter for city "{selectedCity}".</span>
          </div>
        ) : (
          /* Grouped by City Sections */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {cityEntries.map(([city, cityReadings]) => {
              const hasFault = cityReadings.some(
                (r) => r.anomalyStatus === "detected" || r.anomalyStatus === "saved"
              );
              return (
                <div key={city} className="city-cluster-section">
                  <div className="city-cluster-header">
                    <div className="city-cluster-header-left">
                      <MapPin size={16} style={{ color: "#38bdf8" }} />
                      <span className="city-cluster-name">{city} City Stations</span>
                      <span className="city-cluster-badge">
                        {cityReadings.length} {cityReadings.length === 1 ? "Station Node" : "Station Nodes"}
                      </span>
                    </div>

                    <div className="city-cluster-status">
                      {hasFault ? (
                        <span style={{ color: "var(--color-red)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <AlertCircle size={13} /> Active Anomaly Detected
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle size={13} /> All Nodes Nominal
                        </span>
                      )}
                    </div>
                  </div>

                  {viewMode === "grid" ? (
                    <div className="station-monitor-grid">
                      {cityReadings.map((reading) => (
                        <StationMonitorCard key={reading.stationId || reading._id} reading={reading} />
                      ))}
                    </div>
                  ) : (
                    <div className="card">
                      <StationTable readings={cityReadings} loading={loading} error={error} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
