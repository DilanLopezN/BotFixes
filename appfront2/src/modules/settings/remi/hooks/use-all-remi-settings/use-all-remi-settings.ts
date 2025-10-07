import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { fetchAllRemiSettings } from '~/services/workspace/fetch-all-remi-settings';
import { notifyError } from '~/utils/notify-error';

export const useAllRemiSettings = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<RemiConfigData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const { t } = useTranslation();
  const { useAllRemiSettings: remiKeys } = localeKeys.settings.remi.hooks;

  const fetchRemiSettings = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAllRemiSettings(workspaceId);
      setData(response);
    } catch (err) {
      setError(err as ApiError);
      notifyError({ message: t(remiKeys.fetchError) });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, t, remiKeys.fetchError]);

  useEffect(() => {
    fetchRemiSettings();
  }, [fetchRemiSettings]);

  return {
    data,
    isLoading,
    error,
    fetchRemiSettings,
  };
};
