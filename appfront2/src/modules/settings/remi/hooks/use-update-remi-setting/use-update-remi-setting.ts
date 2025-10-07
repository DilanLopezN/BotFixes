import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { updateRemiSetting } from '~/services/workspace/update-remi-setting';
import { notifyError } from '~/utils/notify-error';

export const useUpdateRemiSetting = () => {
  const { workspaceId = '' } = useParams<{
    workspaceId: string;
  }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<ApiError | null>(null);

  const { t } = useTranslation();
  const { useUpdateRemiSetting: remiKeys } = localeKeys.settings.remi.hooks;

  const updateRemiSettings = async (
    configData: Partial<RemiConfigData>,
    settingId: string
  ): Promise<RemiConfigData | null> => {
    if (!workspaceId) {
      setUpdateError(new Error('Missing IDs for update') as ApiError);
      return null;
    }

    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await updateRemiSetting(workspaceId, settingId, configData);
      setIsUpdating(false);
      return response;
    } catch (err) {
      setUpdateError(err as ApiError);
      notifyError({ message: t(remiKeys.updateError) });
      return null;
    }
  };

  return {
    updateRemiSetting: updateRemiSettings,
    isUpdating,
    updateError,
  };
};
