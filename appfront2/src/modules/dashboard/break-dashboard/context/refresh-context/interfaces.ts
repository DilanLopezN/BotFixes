import type { ReactNode } from 'react';

export interface RefetchProviderProps {
  children: ReactNode;
}

export interface RefreshContextProps {
  refreshKey: number;
  handleRefresh: () => void;
  isRefreshing: boolean;
  startLoading: () => void;
  endLoading: () => void;
}
