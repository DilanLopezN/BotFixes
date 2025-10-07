import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import {
  bulkToggleBreaksStatusByIds,
  type BulkToggleBreaksStatusByIdsProps,
} from '~/services/workspace/bulk-toggle-breaks-status-by-ids';

export const useToggleBreaksStatus = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<ApiError>();

  const toggleBreaksStatus = useCallback(
    async (props: BulkToggleBreaksStatusByIdsProps) => {
      if (isToggling) return;

      try {
        setError(undefined);
        setIsToggling(true);
        const result = await bulkToggleBreaksStatusByIds(workspaceId, props);
        setIsToggling(false);
        return result;
      } catch (err) {
        setError(err as ApiError);
        setIsToggling(false);
        return false;
      }
    },
    [isToggling, workspaceId]
  );

  return { isToggling, error, toggleBreaksStatus };
};
