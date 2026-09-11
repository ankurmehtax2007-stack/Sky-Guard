import { Link } from "react-router-dom";
import { useAnomalies } from "../../hooks/useAnomalies";
import { useRealtimeAnomalies } from "../../hooks/useRealtimeData";
import { formatRelativeTime, getSensorLabel, formatFaultType } from "../../utils/formatters";
import { Bell, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export function RecentAnomalies() {
  const { data: baseAnomalies, loading, error, refetch } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);
  const recent = anomalies.slice(0, 3);

  return (
    <div className="recent-alerts-card">
      <div className="recent-alerts-header">
        <div className="recent-alerts-title-wrap">
          <div className="recent-alerts-icon-badge">
            <Bell size={16} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="recent-alerts-title">Recent Alerts</h2>
        </div>
        <Link to="/anomalies" className="recent-alerts-view-all">
          View All →
        </Link>
      </div>

      <div className="recent-alerts-list">
        {recent.length === 0 ? (
          <>
            <div className="recent-alert-item">
              <div className="recent-alert-icon recent-alert-icon--info">
                <Info size={15} />
              </div>
              <div className="recent-alert-info">
                <span className="recent-alert-name">No active alerts</span>
                <span className="recent-alert-desc">All stations are operating normally.</span>
              </div>
              <span className="recent-alert-time">2h ago</span>
            </div>
            <div className="recent-alert-item">
              <div className="recent-alert-icon recent-alert-icon--warn">
                <AlertTriangle size={15} />
              </div>
              <div className="recent-alert-info">
                <span className="recent-alert-name">AWS_02 — Sensor Calibrated</span>
                <span className="recent-alert-desc">Telemetry baseline validated</span>
              </div>
              <span className="recent-alert-time">5h ago</span>
            </div>
            <div className="recent-alert-item">
              <div className="recent-alert-icon recent-alert-icon--ok">
                <CheckCircle2 size={15} />
              </div>
              <div className="recent-alert-info">
                <span className="recent-alert-name">AWS_03 — Recovered</span>
                <span className="recent-alert-desc">Sensor back online</span>
              </div>
              <span className="recent-alert-time">6h ago</span>
            </div>
          </>
        ) : (
          recent.map((a) => {
            const isCrit = a.severity === "critical" || a.severity === "high";
            return (
              <div key={a._id} className="recent-alert-item">
                <div className={`recent-alert-icon ${isCrit ? "recent-alert-icon--warn" : "recent-alert-icon--info"}`}>
                  {isCrit ? <AlertTriangle size={15} /> : <Info size={15} />}
                </div>
                <div className="recent-alert-info">
                  <span className="recent-alert-name">
                    {a.stationId} — {formatFaultType(a.anomalyType, a.sensor, a.value)}
                  </span>
                  <span className="recent-alert-desc">
                    {getSensorLabel(a.sensor)} incident recorded ({a.status})
                  </span>
                </div>
                <span className="recent-alert-time">
                  {formatRelativeTime(a.detectedAt || a.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
