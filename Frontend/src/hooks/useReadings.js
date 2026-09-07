import { useState, useEffect, useCallback } from "react";
import { getLatestReadings, getStationReadings } from "../api/reading";
import { parseApiError } from "../utils/formatters";
import { ACTIVE_STATION_IDS } from "../utils/constants";

export function useLatestReadings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLatestReadings();
      const raw = res.data ?? [];
      const filtered = raw.filter((r) => ACTIVE_STATION_IDS.includes(r.stationId));
      setData(filtered.length > 0 ? filtered : raw);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useStationReadings(stationId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!stationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getStationReadings(stationId);
      setData(res.data ?? null);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
