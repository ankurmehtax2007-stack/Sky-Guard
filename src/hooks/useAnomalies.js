import { useState, useEffect, useCallback } from "react";
import { getAnomalies, getStationAnomalies, getAnomalyById, updateAnomalyStatus } from "../api/anomalies";
import { getLatestReadings } from "../api/reading";
import { parseApiError } from "../utils/formatters";
import { ACTIVE_STATION_IDS } from "../utils/constants";
import {
  loadSavedAnomalies,
  saveAnomaliesToStorage,
  normalizeReadingToAnomaly,
  mergeAnomalies,
} from "../utils/anomalyStorage";

export function useAnomalies() {
  const [data, setData] = useState(() =>
    loadSavedAnomalies().filter((a) => !a.stationId || ACTIVE_STATION_IDS.includes(a.stationId))
  );
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setError(null);

    try {
      // 1. Fetch official anomaly records directly from backend
      const res = await getAnomalies({ limit: 100 });
      if (res?.data?.anomalies) {
        const serverAnomalies = res.data.anomalies.filter(
          (a) => !a.stationId || ACTIVE_STATION_IDS.includes(a.stationId)
        );
        setData(serverAnomalies);
        setPagination(res.data?.pagination ?? null);
        saveAnomaliesToStorage(serverAnomalies);
      }
    } catch (err) {
      // Fall back to local cached storage if backend is unreachable
      const cached = loadSavedAnomalies().filter((a) => !a.stationId || ACTIVE_STATION_IDS.includes(a.stationId));
      if (cached.length > 0) {
        setData(cached);
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, pagination, loading, error, refetch: fetch };
}

export function useStationAnomalies(stationId) {
  const [data, setData] = useState(() => {
    const saved = loadSavedAnomalies();
    return stationId ? saved.filter((a) => a.stationId === stationId) : saved;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!stationId) return;
    setError(null);
    try {
      const res = await getStationAnomalies(stationId);
      const serverAnomalies = res.data?.anomalies ?? [];
      const saved = loadSavedAnomalies().filter((a) => a.stationId === stationId);
      const merged = mergeAnomalies(saved, serverAnomalies);
      setData(merged);
    } catch (err) {
      // If server query failed, rely on saved local anomalies
      const saved = loadSavedAnomalies().filter((a) => a.stationId === stationId);
      if (saved.length > 0) {
        setData(saved);
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useAnomalyDetail(anomalyId) {
  const [data, setData] = useState(() => {
    const saved = loadSavedAnomalies();
    return saved.find((a) => a._id === anomalyId) || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetch = useCallback(async () => {
    if (!anomalyId) return;
    setError(null);
    try {
      const res = await getAnomalyById(anomalyId);
      if (res?.data) {
        setData(res.data);
      }
    } catch {
      // If server fetch fails, fallback to local saved record
      const saved = loadSavedAnomalies();
      const match = saved.find((a) => a._id === anomalyId);
      if (match) {
        setData(match);
      } else {
        setError("Anomaly record not found");
      }
    } finally {
      setLoading(false);
    }
  }, [anomalyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateStatus = useCallback(
    async (status) => {
      setUpdating(true);
      setUpdateError(null);

      // Optimistically update local state & storage
      setData((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          status,
          resolvedAt: status === "resolved" ? new Date().toISOString() : prev.resolvedAt,
          resolvedBy: status === "resolved" ? "Operator" : prev.resolvedBy,
        };
        const all = loadSavedAnomalies();
        const updatedAll = all.map((item) => (item._id === anomalyId ? updated : item));
        saveAnomaliesToStorage(updatedAll);
        return updated;
      });

      try {
        await updateAnomalyStatus(anomalyId, status);
      } catch {
        // Even if server status patch fails, local status remains updated
      } finally {
        setUpdating(false);
      }
    },
    [anomalyId]
  );

  return { data, loading, error, updating, updateError, refetch: fetch, updateStatus };
}
