import { useState, useCallback, useEffect, useRef } from "react";
import { useWsMessage } from "../context/WebSocketContext";
import { useLatestReadings } from "./useReadings";
import { ACTIVE_STATION_IDS } from "../utils/constants";
import { getTotalReadingsCount, getStationReadings } from "../api/reading";
import {
  loadSavedAnomalies,
  saveAnomaliesToStorage,
  normalizeReadingToAnomaly,
  mergeAnomalies,
} from "../utils/anomalyStorage";

/**
 * Extends useLatestReadings with real-time WebSocket updates.
 *
 * Backend broadcasts: { type: "READING_UPDATED", data: ReadingObject }
 *
 * 1. Fetches initial latest readings via REST
 * 2. Listens on the shared WebSocket for READING_UPDATED events
 * 3. Updates the in-memory map (keyed by stationId) with the live reading
 */
export function useRealtimeReadings() {
  const {
    data: initialReadings,
    loading,
    error,
    refetch,
  } = useLatestReadings();

  const [liveMap, setLiveMap] = useState(new Map());

  // Seed map from REST once it loads
  useEffect(() => {
    if (initialReadings && initialReadings.length > 0) {
      setLiveMap((prev) => {
        const next = new Map(prev);
        for (const r of initialReadings) {
          if (!next.has(r.stationId)) {
            next.set(r.stationId, r);
          }
        }
        return next;
      });
    }
  }, [initialReadings]);

  // Subscribe to WebSocket messages via shared context
  const handleMessage = useCallback((msg) => {
    if (msg.type === "READING_UPDATED" && msg.data?.stationId) {
      if (!ACTIVE_STATION_IDS.includes(msg.data.stationId)) return;
      setLiveMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(msg.data.stationId);
        next.set(msg.data.stationId, { ...existing, ...msg.data });
        return next;
      });
    } else if (msg.type === "ANOMALY_DETECTED" && (msg.stationId || msg.anomaly?.stationId)) {
      const stId = msg.stationId || msg.anomaly?.stationId;
      if (!ACTIVE_STATION_IDS.includes(stId)) return;
      setLiveMap((prev) => {
        const current = prev.get(stId);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(stId, {
          ...current,
          anomalyStatus: "detected",
          anomalyPrediction: {
            isAnomaly: true,
            sensor: msg.anomaly?.sensor,
            anomalyType: msg.anomaly?.anomalyType,
            severity: msg.anomaly?.severity || "high",
          },
        });
        return next;
      });
    }
  }, []);

  useWsMessage(handleMessage);

  const data = Array.from(liveMap.values())
    .filter((r) => ACTIVE_STATION_IDS.includes(r.stationId))
    .sort((a, b) =>
      (a.stationId ?? "").localeCompare(b.stationId ?? "")
    );

  return {
    data,
    loading: loading && liveMap.size === 0,
    error: liveMap.size > 0 ? null : error,
    refetch,
  };
}

/**
 * Extends a base anomaly list with real-time WebSocket updates.
 *
 * Backend broadcasts:
 * 1. { type: "ANOMALY_DETECTED", stationId, anomaly: AnomalyObject }
 * 2. { type: "READING_UPDATED", data: ReadingObject } (where anomaly=true or anomalyStatus="detected")
 *
 * Prepends live anomalies to the top, deduplicates, and saves to storage.
 */
export function useRealtimeAnomalies(baseData) {
  const [liveAnomalies, setLiveAnomalies] = useState(() => {
    if (baseData && baseData.length > 0) return baseData;
    return loadSavedAnomalies();
  });

  useEffect(() => {
    if (baseData && Array.isArray(baseData)) {
      setLiveAnomalies((prev) => {
        if (!prev || prev.length === 0) return baseData;
        return mergeAnomalies(baseData, prev);
      });
    }
  }, [baseData]);

  const handleMessage = useCallback((msg) => {
    // Authoritative Anomaly Detection Event from ML Service
    if (msg.type === "ANOMALY_DETECTED" && msg.anomaly) {
      if (msg.stationId && !ACTIVE_STATION_IDS.includes(msg.stationId)) return;
      const anom = {
        ...msg.anomaly,
        _id: msg.anomaly._id || `anom_${msg.stationId}_${Date.now()}`,
      };
      setLiveAnomalies((prev) => {
        const next = mergeAnomalies(prev, [anom]);
        saveAnomaliesToStorage(next);
        return next;
      });
    }
  }, []);

  useWsMessage(handleMessage);

  return liveAnomalies.filter((a) => !a.stationId || ACTIVE_STATION_IDS.includes(a.stationId));
}

/**
 * Tracks the total count of active readings across stations in real time.
 * - Seeds initial count from backend /api/readings/stats/count (or per-station fallback)
 * - Increments live on every incoming READING_UPDATED WebSocket packet
 * - Tracks live ingestion rate (readings/min)
 * - Computes dynamic activity sparkline bar heights and a pulse flag for animations
 */
export function useRealtimeReadingCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [readingsInLastMinute, setReadingsInLastMinute] = useState(0);
  const [barHeights, setBarHeights] = useState([10, 14, 18, 20, 22]);

  const recentTimesRef = useRef([]);
  const pulseTimerRef = useRef(null);

  // Synchronize count from database
  const syncCount = useCallback(async () => {
    try {
      let total = 0;
      try {
        const res = await getTotalReadingsCount(ACTIVE_STATION_IDS);
        if (typeof res?.data?.total === "number") {
          total = res.data.total;
        }
      } catch (err) {
        // Fallback: fetch per-station pagination total
        const results = await Promise.all(
          ACTIVE_STATION_IDS.map((id) =>
            getStationReadings(id, { limit: 1 })
              .then((r) => r?.data?.pagination?.total || 0)
              .catch(() => 0)
          )
        );
        total = results.reduce((acc, v) => acc + v, 0);
      }

      if (total > 0) {
        setCount((prev) => (total > prev ? total : prev));
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and resync every 30 seconds
  useEffect(() => {
    syncCount();
    const timer = setInterval(syncCount, 30000);
    return () => clearInterval(timer);
  }, [syncCount]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((msg) => {
    if (msg.type === "READING_UPDATED" && msg.data?.stationId) {
      if (!ACTIVE_STATION_IDS.includes(msg.data.stationId)) return;

      const now = Date.now();
      const updated = [...recentTimesRef.current.filter((t) => now - t < 60000), now];
      recentTimesRef.current = updated;
      setReadingsInLastMinute(updated.length);

      // Increment count live
      setCount((prev) => (prev > 0 ? prev + 1 : 1));

      // Visual pulse
      setIsPulsing(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setIsPulsing(false);
      }, 600);

      // Compute 5 bar heights based on 12-second intervals of the last minute
      const counts = [0, 0, 0, 0, 0];
      for (const t of updated) {
        const ageSec = (now - t) / 1000;
        const idx = Math.min(4, Math.max(0, 4 - Math.floor(ageSec / 12)));
        counts[idx]++;
      }
      const maxC = Math.max(1, ...counts);
      const heights = counts.map((c, i) => {
        if (c === 0) return 6 + i * 3;
        return Math.min(23, Math.max(6, Math.round(6 + (c / maxC) * 16)));
      });
      setBarHeights(heights);
    }
  }, []);

  useWsMessage(handleMessage);

  // Prune timestamps older than 60s periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const valid = recentTimesRef.current.filter((t) => now - t < 60000);
      recentTimesRef.current = valid;
      setReadingsInLastMinute(valid.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return {
    count,
    loading,
    isPulsing,
    readingsInLastMinute,
    barHeights,
  };
}

