import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api/client';
import { useToast } from '../context/ToastContext';

export function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function useFetch(url, params) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!url) return setLoading(false);
    setLoading(true);
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(res.data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}
