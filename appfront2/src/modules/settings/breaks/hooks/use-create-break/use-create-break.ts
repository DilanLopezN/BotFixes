import { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { BreakTime } from '~/interfaces/break-time';
import { ApiErrorType } from '~/modules/settings/categorization/constants';
import { createBreak } from '~/services/workspace/create-break';
import { notifyError } from '~/utils/notify-error';

export const useCreateBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const { t } = useTranslation();

  const useCreateBreakLocaleKeys = localeKeys.settings.breaks.hooks.useCreateBreak;

  const createNewBreak = useCallback(
    async (breakTime: Partial<BreakTime>) => {
      if (isCreating) return false;

      try {
        setError(undefined);
        setIsCreating(true);
        const newBreak = await createBreak(workspaceId, {
          ...breakTime,
          durationSeconds: (breakTime?.durationSeconds || 0) * 60,
          enabled: true,
        });
        setIsCreating(false);
        return newBreak;
      } catch (err) {
        if (err instanceof AxiosError) {
          const errorCode = err.response?.data?.error;
          if (errorCode === ApiErrorType.ALREADY_EXIST_GENERAL_BREAK_SETTING) {
            notifyError(t(useCreateBreakLocaleKeys.notifyErrorBreakExists));
          } else {
            notifyError(t(useCreateBreakLocaleKeys.notifyErrorCreate));
          }
          setError(err as ApiError);
        }
        setIsCreating(false);
        return false;
      }
    },
    [
      isCreating,
      workspaceId,
      t,
      useCreateBreakLocaleKeys.notifyErrorBreakExists,
      useCreateBreakLocaleKeys.notifyErrorCreate,
    ]
  );

  return { isCreating, error, createNewBreak };
};
