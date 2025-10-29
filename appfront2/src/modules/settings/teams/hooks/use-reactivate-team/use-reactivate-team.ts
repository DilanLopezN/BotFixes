import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { reactivateTeamById } from '~/services/workspace/reactivate-team-by-id';

export const useReactivateTeam = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const reactivateTeam = useCallback(
    async (teamId: string) => {
      try {
        setIsReactivating(true);
        await reactivateTeamById({ workspaceId, teamId });
        setIsReactivating(false);
        return true;
      } catch (err) {
        setError(err as ApiError);
        setIsReactivating(false);
        return false;
      }
    },
    [workspaceId]
  );

  return { isReactivating, error, reactivateTeam };
};
