import { useState, useEffect, useCallback, useRef } from "react";
import { getAnomalyStats } from "../api/anomalies";
import { useCityScope } from "../context/CityScope";
import { useWsMessage } from "../context/WebSocketContext";
import { ACTIVE_STATION_IDS } from "../utils/constants";

export function useAnomalyStats(overrideStationId) {
  const { stationId: cityStationId } = useCityScope();
  const effectiveStationId = overrideStationId !== undefined ? overrideStationId : cityStationId;

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    acknowledged: 0,
    resolved: 0,
    active: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeoutRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = effectiveStationId ? { stationId: effectiveStationId } : {};
      const res = await getAnomalyStats(params);
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load anomaly statistics");
    } finally {
      setLoading(false);
    }
  }, [effectiveStationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle live WebSocket updates to keep stats synchronous with DB
  const handleWsMessage = useCallback((msg) => {
    if (!msg) return;

    const msgStation = msg.stationId || msg.anomaly?.stationId;
    if (effectiveStationId && msgStation && msgStation !== effectiveStationId) {
      return;
    }
    if (msgStation && !ACTIVE_STATION_IDS.includes(msgStation)) {
      return;
    }

    if (msg.type === "ANOMALY_DETECTED") {
      const severity = (msg.anomaly?.severity || "").toLowerCase();
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
        active: prev.active + 1,
        critical: severity === "critical" ? prev.critical + 1 : prev.critical,
      }));

      // Debounce a background sync to verify full consistency
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchStats();
      }, 3000);
    } else if (msg.type === "ANOMALY_STATUS_UPDATED") {
      const newStatus = (msg.anomaly?.status || "").toLowerCase();
      if (newStatus === "resolved") {
        setStats((prev) => ({
          ...prev,
          resolved: prev.resolved + 1,
          pending: Math.max(0, prev.pending - 1),
          active: Math.max(0, prev.active - 1),
        }));
      }

      // Sync with server authoritative count
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchStats();
      }, 1000);
    }
  }, [effectiveStationId, fetchStats]);

  useWsMessage(handleWsMessage);

  return { stats, loading, error, refetch: fetchStats };
}
