import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { Team } from '~/interfaces/team';
import { updateTeamById } from '~/services/workspace/update-team-by-id';

export const useUpdateTeam = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string; teamId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<ApiError>();

  const updateTeam = useCallback(
    async (team: Team) => {
      try {
        setUpdateError(undefined);
        setIsUpdating(true);
        const response = await updateTeamById(workspaceId, team);
        setIsUpdating(false);
        return response;
      } catch (err) {
        setUpdateError(err as ApiError);
        setIsUpdating(false);
        return false;
      }
    },
    [workspaceId]
  );

  return { isUpdating, updateError, updateTeam };
};
