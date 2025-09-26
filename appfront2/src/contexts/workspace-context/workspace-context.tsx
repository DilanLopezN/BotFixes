import { createContext, useEffect, useMemo, useState } from 'react';
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
  error: undefined,
});

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const { isAuth } = useAuth();
  const [data, setData] = useState<PaginatedModel<Workspace>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const contextValues = useMemo(() => ({ data, isLoading, error }), [data, error, isLoading]);

  useEffect(() => {
    if (!isAuth) return;

    const fetchWorkspaces = async () => {
      const queryString = createQueryString({
        sort: 'name',
        filter: '{"simple":true}',
      });
      try {
        setIsLoading(true);
        const response = await getWorkspaces(queryString);
        setData(response);
      } catch (err) {
        setError(err as ApiError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [isAuth]);

  return <WorkspaceContext.Provider value={contextValues}>{children}</WorkspaceContext.Provider>;
};
