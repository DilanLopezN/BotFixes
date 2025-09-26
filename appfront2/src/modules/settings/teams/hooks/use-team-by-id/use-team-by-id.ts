import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { Team } from '~/interfaces/team';
import { getTeamById } from '~/services/workspace/get-team-by-id';

export const useTeamById = () => {
  const { workspaceId = '', teamId = '' } = useParams<{ workspaceId: string; teamId: string }>();
  const [data, setData] = useState<Team>();
  const [isFetchingTeam, setIsFetchingTeam] = useState(true);
  const [fetchTeamError, setFetchTeamError] = useState<ApiError>();

  const fetchTeamById = useCallback(async () => {
    try {
      setIsFetchingTeam(true);
      const response = await getTeamById(workspaceId, teamId);
      setData(response.data);
      setIsFetchingTeam(false);
      return response.data;
    } catch (err) {
      setFetchTeamError(err as ApiError);
      setIsFetchingTeam(false);
      return false;
    }
  }, [teamId, workspaceId]);

  return {
    data,
    isFetchingTeam,
    fetchTeamError,
    fetchTeamById,
  };
};
