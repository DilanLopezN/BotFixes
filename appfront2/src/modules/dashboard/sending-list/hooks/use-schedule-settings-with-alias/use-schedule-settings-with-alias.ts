import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { getScheduleSettingsWithAlias } from '~/services/workspace/get-schedule-settings-with-alias';
import { GetScheduleSettingsWithAliasResponse } from '~/services/workspace/get-schedule-settings-with-alias/interfaces';
import { notifyError } from '~/utils/notify-error';

export const useScheduleSettingsWithAlias = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [scheduleSettingsWithAlias, setScheduleSettingsWithAlias] =
    useState<GetScheduleSettingsWithAliasResponse>();
  const [isLoadingScheduleSettingsWithAlias, setIsLoadingScheduleSettingsWithAlias] =
    useState(true);
  const [scheduleSettingsWithAliasError, setScheduleSettingsWithError] = useState<ApiError>();
  const { t } = useTranslation();
  const useScheduleSettingsWithAliasLocaleKeys =
    localeKeys.dashboard.sendingList.hooks.useScheduleSettingsWithAlias;

  const fetchScheduleSettingsWithError = useCallback(async () => {
    try {
      setIsLoadingScheduleSettingsWithAlias(true);
      const response = await getScheduleSettingsWithAlias(workspaceId);
      setScheduleSettingsWithAlias(response);
      setIsLoadingScheduleSettingsWithAlias(false);
      return response;
    } catch (err) {
      const typedError = err as ApiError;
      setScheduleSettingsWithError(typedError);
      setIsLoadingScheduleSettingsWithAlias(false);
      notifyError(t(useScheduleSettingsWithAliasLocaleKeys.notifyError));
      return false;
    }
  }, [t, useScheduleSettingsWithAliasLocaleKeys.notifyError, workspaceId]);

  return {
    scheduleSettingsWithAlias,
    isLoadingScheduleSettingsWithAlias,
    scheduleSettingsWithAliasError,
    fetchScheduleSettingsWithError,
  };
};
