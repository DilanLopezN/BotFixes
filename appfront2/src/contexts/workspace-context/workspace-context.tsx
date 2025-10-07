import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '~/hooks/use-auth';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { Workspace } from '~/interfaces/workspace';
import { getWorkspaces } from '~/services/workspace/get-workspaces';
import { createQueryString } from '~/utils/create-query-string';
import type { WorkspaceContextValues, WorkspaceProviderProps } from './interfaces';

export const WorkspaceContext = createContext<WorkspaceContextValues>({
  data: undefined,
  isLoading: true,
  isRefetching: false,
  error: undefined,
  refetch: () => {},
});

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const { isAuth } = useAuth();
  const [data, setData] = useState<PaginatedModel<Workspace>>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<ApiError>();

  const fetchWorkspaces = async (isRefetch = false) => {
    const queryString = createQueryString({
      sort: 'name',
      filter: '{"simple":true}',
    });
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      const response = await getWorkspaces(queryString);
      setData(response);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      if (isRefetch) {
        setIsRefetching(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const refetch = useCallback(() => {
    if (isAuth) {
      fetchWorkspaces(true);
    }
  }, [isAuth]);

  const contextValues = useMemo(
    () => ({ data, isLoading, isRefetching, error, refetch }),
    [data, error, isLoading, isRefetching, refetch]
  );

  useEffect(() => {
    if (!isAuth) return;
    fetchWorkspaces();
  }, [isAuth]);

  return <WorkspaceContext.Provider value={contextValues}>{children}</WorkspaceContext.Provider>;
};
