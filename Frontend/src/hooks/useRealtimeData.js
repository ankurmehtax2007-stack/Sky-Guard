import { useState, useCallback, useEffect } from "react";
import { useWsMessage } from "../context/WebSocketContext";
import { useLatestReadings } from "./useReadings";
import { ACTIVE_STATION_IDS } from "../utils/constants";
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
