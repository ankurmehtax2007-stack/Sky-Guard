import { useState, useEffect, useCallback, useRef } from "react";
import { getHealth } from "../api/health";
import { parseApiError } from "../utils/formatters";

const POLL_INTERVAL = 30_000;

export function useHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetch = useCallback(async () => {
    setError(null);
    try {
      const res = await getHealth();
      setData(res);
    } catch (err) {
      setError(parseApiError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
