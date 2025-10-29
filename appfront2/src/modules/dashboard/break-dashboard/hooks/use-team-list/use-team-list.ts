import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { SimplifiedTeam } from '~/interfaces/simplified-team';
import { getTeamsByWorkspaceId } from '~/services/workspace/get-teams-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';

export const useTeamList = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [teamList, setTeamList] = useState<PaginatedModel<SimplifiedTeam>>();
  const [isFetchingTeamList, setIsFetchingTeamList] = useState(true);
  const [teamListerror, setTeamListError] = useState<ApiError>();

  const queryString = createQueryString({
    sort: 'name',
  });

  const fetchTeamList = useCallback(async () => {
    try {
      setTeamListError(undefined);
      setIsFetchingTeamList(true);
      const response = await getTeamsByWorkspaceId(workspaceId, queryString);
      setTeamList(response);
      setIsFetchingTeamList(false);
      return true;
    } catch (err) {
      setIsFetchingTeamList(false);
      setTeamListError(err as ApiError);
      notifyError('Erro ao carregar times');
      return false;
    }
  }, [queryString, workspaceId]);

  return { teamList, isFetchingTeamList, teamListerror, fetchTeamList };
};
