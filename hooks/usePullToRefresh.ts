import { useCallback, useState } from 'react';

/** Aşağı çekerek yenileme: bayrağı işlem boyunca açık tutar. */
export function usePullToRefresh(load: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  }, [load]);

  return { refreshing, onRefresh };
}
