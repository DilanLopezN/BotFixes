import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { inactivateTeamById } from '~/services/workspace/inactivate-team-by-id';

export const useInactivateTeam = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isInactivating, setIsInactivating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const inactivateTeam = useCallback(
    async (teamId: string) => {
      try {
        setIsInactivating(true);
        await inactivateTeamById({ workspaceId, teamId });
        setIsInactivating(false);
        return true;
      } catch (err) {
        setError(err as ApiError);
        setIsInactivating(false);
        return false;
      }
    },
    [workspaceId]
  );

  return { isInactivating, error, inactivateTeam };
};
