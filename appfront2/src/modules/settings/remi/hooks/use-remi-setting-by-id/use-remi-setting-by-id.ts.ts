import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { fetchRemiSettingById } from '~/services/workspace/fetch-remi-setting-by-id';
import { notifyError } from '~/utils/notify-error';

export const useRemiSettingById = () => {
  const { workspaceId = '', remiId } = useParams<{ workspaceId: string; remiId: string }>();

  const [data, setData] = useState<RemiConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const { t } = useTranslation();
  const { useRemiSettingById: remiKeys } = localeKeys.settings.remi.hooks;

  const fetchRemiSetting = useCallback(async () => {
    if (!workspaceId || !remiId || remiId === 'new') {
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchRemiSettingById(workspaceId, remiId);
      setIsLoading(false);
      setData(response);
      return response;
    } catch (err) {
      setError(err as ApiError);
      notifyError({ message: t(remiKeys.fetchError) });
      return null;
    }
  }, [workspaceId, remiId, t, remiKeys.fetchError]);

  useEffect(() => {
    if (workspaceId && remiId) {
      fetchRemiSetting();
    } else {
      setIsLoading(false);
      setData(null);
    }
  }, [fetchRemiSetting, workspaceId, remiId]);

  return {
    data,
    isLoading,
    error,
    fetchRemiSetting,
  };
};
