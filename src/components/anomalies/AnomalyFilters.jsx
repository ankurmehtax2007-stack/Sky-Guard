import { SENSOR_LABELS, SEVERITY_CONFIG, ANOMALY_STATUS_CONFIG } from "../../utils/constants";
import { Search, X } from "lucide-react";

export function AnomalyFilters({ filters, onChange, stations }) {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="filters-bar" style={{ gap: "10px" }}>
      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
          }}
        />
        <input
          type="text"
          className="search-bar-input"
          style={{ width: "200px" }}
          placeholder="Search incident / type…"
          value={filters.search || ""}
          onChange={(e) => handleChange("search", e.target.value)}
        />
      </div>

      <select
        id="filter-station"
        className="filter-select"
        value={filters.stationId}
        onChange={(e) => handleChange("stationId", e.target.value)}
        aria-label="Filter by station"
      >
        <option value="">All Stations</option>
        {stations.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      <select
        id="filter-sensor"
        className="filter-select"
        value={filters.sensor}
        onChange={(e) => handleChange("sensor", e.target.value)}
        aria-label="Filter by sensor"
      >
        <option value="">All Sensors</option>
        {Object.entries(SENSOR_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <select
        id="filter-severity"
        className="filter-select"
        value={filters.severity}
        onChange={(e) => handleChange("severity", e.target.value)}
        aria-label="Filter by severity"
      >
        <option value="">All Severities</option>
        {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>

      <select
        id="filter-status"
        className="filter-select"
        value={filters.status}
        onChange={(e) => handleChange("status", e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        {Object.entries(ANOMALY_STATUS_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({ search: "", stationId: "", sensor: "", severity: "", status: "" })}
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <X size={13} />
          Reset Filters
        </button>
      )}
    </div>
  );
}

export function applyAnomalyFilters(anomalies, filters) {
  return anomalies.filter((a) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        (a.stationId || "").toLowerCase().includes(q) ||
        (a.anomalyType || "").toLowerCase().includes(q) ||
        (a.message || "").toLowerCase().includes(q) ||
        (a.action || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.stationId && a.stationId !== filters.stationId) return false;
    if (filters.sensor && a.sensor !== filters.sensor) return false;
    if (filters.severity && a.severity !== filters.severity) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  });
}
