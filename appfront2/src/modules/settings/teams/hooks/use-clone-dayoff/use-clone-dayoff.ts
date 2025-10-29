import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { DayOff } from '~/interfaces/day-off';
import { createDayoff } from '~/services/workspace/create-day-off';

export const useCloneDayoff = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<ApiError>();

  const cloneDayoff = useCallback(
    async (dayOff: DayOff, teamIdList: string[]) => {
      try {
        setError(undefined);
        setIsCloning(true);
        await createDayoff(workspaceId, { offDay: dayOff, teamIds: teamIdList });
        setIsCloning(false);
        return true;
      } catch (err) {
        setError(err as ApiError);
        setIsCloning(false);
        return false;
      }
    },
    [workspaceId]
  );

  return { isCloning, error, cloneDayoff };
};
