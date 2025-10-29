import { ReactNode } from 'react';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { Workspace } from '~/interfaces/workspace';

export interface WorkspaceContextValues {
  data?: PaginatedModel<Workspace>;
  isLoading: boolean;
  isRefetching: boolean;
  error?: ApiError;
  refetch: () => void;
}

export interface WorkspaceProviderProps {
  children: ReactNode;
}
