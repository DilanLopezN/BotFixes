import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { Team } from '~/interfaces/team';
import { createTeam } from '~/services/workspace/create-team';

export const useCreateNewTeam = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const createNewTeam = useCallback(
    async (team: Team) => {
      try {
        setError(undefined);
        setIsCreating(true);
        const newTeam = await createTeam(workspaceId, team);
        setIsCreating(false);
        return newTeam;
      } catch (err) {
        setError(err as ApiError);
        setIsCreating(false);
        return false;
      }
    },
    [workspaceId]
  );

  return { isCreating, error, createNewTeam };
};
