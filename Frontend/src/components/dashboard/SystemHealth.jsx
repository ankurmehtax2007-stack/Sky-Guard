import { useHealth } from "../../hooks/useHealth";
import { ServiceStatusDot } from "../common/StatusBadge";
import { SERVICE_LABELS } from "../../utils/constants";
import { formatRelativeTime } from "../../utils/formatters";

export function SystemHealth() {
  const { data, loading, error } = useHealth();

  const isHealthy = data?.status === "healthy";
  const services = data?.services ?? {};

  return (
    <div
      className={`health-banner ${
        isHealthy
          ? "health-banner--ok"
          : error
          ? "health-banner--error"
          : "health-banner--warn"
      }`}
    >
      <div className="health-banner-status">
        <span
          className={`live-dot ${
            loading ? "live-dot--gray" : isHealthy ? "" : "live-dot--red"
          }`}
          style={!loading && isHealthy ? { background: "var(--color-green)" } : undefined}
        />
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {loading
            ? "Checking system status…"
            : error
            ? "Unable to reach backend"
            : isHealthy
            ? "All systems operational"
            : "System degraded — one or more services are down"}
        </span>
      </div>

      {!loading && data && Object.keys(services).length > 0 && (
        <div className="health-banner-services">
          {Object.entries(services).map(([key, val]) => (
            <ServiceStatusDot
              key={key}
              status={val?.status}
              label={SERVICE_LABELS[key] ?? key}
            />
          ))}
        </div>
      )}
    </div>
  );
}
