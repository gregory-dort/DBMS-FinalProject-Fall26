import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../api/http";

/**
 * The one data-loading pattern every page uses (we chose Axios without TanStack Query).
 *
 *   const { data, loading, error, reload } = useApi(() => getProducts(filters), [filters]);
 *
 * After a change (e.g. receiving stock) call reload() on any data the page shows.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
