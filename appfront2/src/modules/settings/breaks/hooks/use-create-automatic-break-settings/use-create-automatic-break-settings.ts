import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { AutomaticBreakSettings } from '~/interfaces/automatic-break-settings';
import { createAutomaticBreakSettings } from '~/services/workspace/create-automatic-break-settings';

export const useCreateAutomaticBreakSettings = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const createNewAutomaticBreakSettings = useCallback(
    async (automaticBreakSettings: Partial<AutomaticBreakSettings>) => {
      if (isCreating) return;

      try {
        setError(undefined);
        setIsCreating(true);
        const newAutomaticBreakSettings = await createAutomaticBreakSettings(workspaceId, {
          ...automaticBreakSettings,
          maxInactiveDurationSeconds:
            (automaticBreakSettings?.maxInactiveDurationSeconds || 0) * 60,
          notificationIntervalSeconds:
            (automaticBreakSettings?.notificationIntervalSeconds || 0) * 60,
          breakStartDelaySeconds: (automaticBreakSettings?.breakStartDelaySeconds || 0) * 60,
        });
        setIsCreating(false);
        return newAutomaticBreakSettings;
      } catch (err) {
        setError(err as ApiError);
        setIsCreating(false);
        return false;
      }
    },
    [isCreating, workspaceId]
  );

  return { isCreating, error, createNewAutomaticBreakSettings };
};
