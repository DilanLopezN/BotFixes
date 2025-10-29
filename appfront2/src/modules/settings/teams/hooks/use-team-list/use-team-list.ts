import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { SimplifiedTeam } from '~/interfaces/simplified-team';
import { getTeamsByWorkspaceId } from '~/services/workspace/get-teams-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';
import type { UseTeamListProps } from './interfaces';

export const useTeamList = ({ currentPage, pageSize, search }: UseTeamListProps) => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<PaginatedModel<SimplifiedTeam>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const queryString = useMemo(() => {
    if (!pageSize || !currentPage) {
      return '';
    }

    const limitedPageSize = Math.min(pageSize, 100);

    const qString = createQueryString({
      limit: limitedPageSize,
      skip: Math.max(currentPage - 1, 0) * limitedPageSize,
      search,
      sort: 'name',
    });
    return qString;
  }, [currentPage, pageSize, search]);

  const fetchTeamList = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getTeamsByWorkspaceId(workspaceId, queryString, 5);
      setData(response);
    } catch (err) {
      setError(err as ApiError);
      notifyError(err);
    } finally {
      setIsLoading(false);
    }
  }, [queryString, workspaceId]);

  return { data, isLoading, error, fetchTeamList };
};
