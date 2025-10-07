import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { AutomaticBreakSettings } from '~/interfaces/automatic-break-settings';
import { updateAutomaticBreakSettings } from '~/services/workspace/update-automatic-break-settings';

export const useUpdateAutomaticBreakSettings = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const updateAutoBreakSettings = useCallback(
    async (automaticBreakSettings: Partial<AutomaticBreakSettings>) => {
      if (isUpdating) return;

      try {
        setError(undefined);
        setIsUpdating(true);
        const newAutomaticBreakSettings = await updateAutomaticBreakSettings(workspaceId, {
          ...automaticBreakSettings,
          maxInactiveDurationSeconds:
            (automaticBreakSettings?.maxInactiveDurationSeconds || 0) * 60,
          notificationIntervalSeconds:
            (automaticBreakSettings?.notificationIntervalSeconds || 0) * 60,
          breakStartDelaySeconds: (automaticBreakSettings?.breakStartDelaySeconds || 0) * 60,
        });
        setIsUpdating(false);
        return newAutomaticBreakSettings;
      } catch (err) {
        setError(err as ApiError);
        setIsUpdating(false);
        return false;
      }
    },
    [isUpdating, workspaceId]
  );

  return {
    isUpdating,
    error,
    updateAutoBreakSettings,
  };
};
