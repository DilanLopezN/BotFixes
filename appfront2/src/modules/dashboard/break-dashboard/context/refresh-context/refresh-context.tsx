import { createContext, useCallback, useMemo, useState } from 'react';
import type { RefetchProviderProps, RefreshContextProps } from './interfaces';

export const RefreshContext = createContext<RefreshContextProps>({
  refreshKey: 0,
  handleRefresh: () => {},
  isRefreshing: false,
  startLoading: () => {},
  endLoading: () => {},
});

export const RefreshProvider = ({ children }: RefetchProviderProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeRequests, setActiveRequests] = useState(0);

  const isRefreshing = activeRequests > 0;

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setRefreshKey((k) => k + 1);
  }, [isRefreshing]);

  const startLoading = useCallback(() => {
    setActiveRequests((prev) => prev + 1);
  }, []);

  const endLoading = useCallback(() => {
    setActiveRequests((prev) => Math.max(0, prev - 1));
  }, []);

  const values = useMemo(() => {
    return { refreshKey, handleRefresh, isRefreshing, startLoading, endLoading };
  }, [endLoading, handleRefresh, isRefreshing, refreshKey, startLoading]);

  return <RefreshContext.Provider value={values}>{children}</RefreshContext.Provider>;
};
