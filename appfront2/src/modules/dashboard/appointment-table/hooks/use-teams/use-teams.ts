import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { SimplifiedTeam } from '~/interfaces/simplified-team';
import { getTeamsByWorkspaceId } from '~/services/workspace/get-teams-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';

export const useTeams = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [teams, setTeams] = useState<PaginatedModel<SimplifiedTeam>>();
  const [isFetchingTeams, setIsFetchingTeams] = useState(true);
  const [teamserror, setTeamsError] = useState<ApiError>();

  const queryString = createQueryString({
    sort: 'name',
  });

  const fetchTeams = useCallback(async () => {
    try {
      setTeamsError(undefined);
      setIsFetchingTeams(true);
      const response = await getTeamsByWorkspaceId(workspaceId, queryString);
      setTeams(response);
      setIsFetchingTeams(false);
      return true;
    } catch (err) {
      setTeamsError(err as ApiError);
      notifyError(err);
      setIsFetchingTeams(false);
      return false;
    }
  }, [queryString, workspaceId]);

  return { teams, isFetchingTeams, teamserror, fetchTeams };
};
