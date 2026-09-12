import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { useWsMessage } from "../../context/WebSocketContext";
import { playAlertSound, formatSensorValue, getSensorLabel, formatFaultType } from "../../utils/formatters";

export function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Sync with localStorage sound preference
  useEffect(() => {
    const pref = localStorage.getItem("skyguard_audio_alert");
    if (pref === "true") setSoundEnabled(true);
  }, []);

  const handleMessage = useCallback((msg) => {
    if (msg.type === "ANOMALY_DETECTED" && msg.anomaly) {
      const a = msg.anomaly;
      const id = `${a._id || Date.now()}-${Math.random()}`;
      
      const newToast = {
        id,
        stationId: a.stationId || msg.stationId,
        sensor: a.sensor,
        value: a.value,
        anomalyType: a.anomalyType,
        severity: a.severity || "high",
        message: a.message || "Unusual telemetry reading detected by AI engine",
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep at most 4 toasts

      // Play audio alert if enabled
      if (localStorage.getItem("skyguard_audio_alert") === "true") {
        playAlertSound(a.severity);
      }

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    }
  }, []);

  useWsMessage(handleMessage);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-item--${toast.severity === "critical" ? "critical" : "high"}`}
        >
          {toast.severity === "critical" ? (
            <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertTriangle size={20} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
          )}

          <div className="toast-content">
            <div className="toast-title">
              <span>{toast.stationId}</span>
              <span>•</span>
              <span>{getSensorLabel(toast.sensor)} Anomaly</span>
              <span className={`badge badge-severity-${toast.severity}`}>
                {toast.severity}
              </span>
            </div>
            <div className="toast-desc">
              {toast.anomalyType ? `${formatFaultType(toast.anomalyType, toast.sensor, toast.value)}: ` : ""}
              Value {formatSensorValue(toast.sensor, toast.value)}. {toast.message}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="toast-close"
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
