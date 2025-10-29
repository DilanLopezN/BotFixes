import { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { BreakTime } from '~/interfaces/break-time';
import { ApiErrorType } from '~/modules/settings/categorization/constants';
import { updateBreakById } from '~/services/workspace/update-break-by-id';
import { notifyError } from '~/utils/notify-error';

export const useUpdateBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const { t } = useTranslation();

  const useUpdateBreakLocaleKeys = localeKeys.settings.breaks.hooks.useUpdateBreak;

  const updateBreak = useCallback(
    async (breakTime: Partial<BreakTime>) => {
      if (isUpdating) return false;

      try {
        setError(undefined);
        setIsUpdating(true);
        const newBreak = await updateBreakById(workspaceId, {
          ...breakTime,
          durationSeconds: (breakTime?.durationSeconds || 0) * 60,
        });
        setIsUpdating(false);
        return newBreak;
      } catch (err) {
        if (err instanceof AxiosError) {
          const errorCode = err.response?.data?.error;
          if (errorCode === ApiErrorType.ALREADY_EXIST_GENERAL_BREAK_SETTING) {
            notifyError(t(useUpdateBreakLocaleKeys.notifyErrorBreakExists));
          } else {
            notifyError(t(useUpdateBreakLocaleKeys.notifyErrorUpdate));
          }
          setError(err as ApiError);
        }
        setIsUpdating(false);
        return false;
      }
    },
    [
      isUpdating,
      workspaceId,
      t,
      useUpdateBreakLocaleKeys.notifyErrorBreakExists,
      useUpdateBreakLocaleKeys.notifyErrorUpdate,
    ]
  );

  return { isUpdating, error, updateBreak };
};
