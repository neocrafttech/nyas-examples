import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || '';

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export function useOverview(range) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`/analytics/overview?from=${range}`);
      setData(d);
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useTimeseries(range, eventType) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/analytics/timeseries?from=${range}${eventType ? `&event_type=${eventType}` : ''}`;
    apiFetch(url)
      .then((d) => setData(d.series || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [range, eventType]);

  return { data, loading };
}

export function useBreakdown(range) {
  const [data, setData] = useState([]);
  useEffect(() => {
    apiFetch(`/analytics/events/breakdown?from=${range}`)
      .then((d) => setData(d.breakdown || []))
      .catch(() => {});
  }, [range]);
  return data;
}

export function useReferrers(range) {
  const [data, setData] = useState([]);
  useEffect(() => {
    apiFetch(`/analytics/referrers?from=${range}`)
      .then((d) => setData(d.referrers || []))
      .catch(() => {});
  }, [range]);
  return data;
}

export function useLive(refreshMs = 10_000) {
  const [data, setData] = useState({ events: 0, active_sessions: 0 });
  useEffect(() => {
    const tick = () => apiFetch('/analytics/live?seconds=60').then(setData).catch(() => {});
    tick();
    const id = setInterval(tick, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return data;
}
