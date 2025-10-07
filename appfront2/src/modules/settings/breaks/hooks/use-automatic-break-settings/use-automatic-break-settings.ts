import { isEmpty } from 'lodash';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { AutomaticBreakSettings } from '~/interfaces/automatic-break-settings';
import { getAutomaticBreakSettings } from '~/services/workspace/get-automatic-break-settings';
import { notifyError } from '~/utils/notify-error';

export const useAutomaticBreakSettings = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [automaticBreakSettings, setAutomaticBreakSettings] = useState<AutomaticBreakSettings>();
  const [isFetchingAutomaticBreakSettings, setIsFetchingAutomaticBreakSettings] = useState(true);
  const [fetchAutomaticBreakSettingsError, setFetchAutomaticBreakSettingsError] =
    useState<ApiError>();

  const fetchAutomaticBreakSettings = useCallback(async () => {
    try {
      setFetchAutomaticBreakSettingsError(undefined);
      setIsFetchingAutomaticBreakSettings(true);
      const response = await getAutomaticBreakSettings(workspaceId);
      const result = !isEmpty(response.data) ? response.data : undefined;
      setAutomaticBreakSettings(result);
      setIsFetchingAutomaticBreakSettings(false);
      return true;
    } catch (error) {
      notifyError('Erro ao carregar configurações da pausa automática');
      setFetchAutomaticBreakSettingsError(error as ApiError);
      setIsFetchingAutomaticBreakSettings(false);
      return false;
    }
  }, [workspaceId]);

  return {
    automaticBreakSettings,
    isFetchingAutomaticBreakSettings,
    fetchAutomaticBreakSettingsError,
    fetchAutomaticBreakSettings,
  };
};
