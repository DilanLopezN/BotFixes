import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import type { RemiConfigData } from '~/interfaces/remi-config-data';
import {
  createRemiSetting,
  type RemiConfigCreateData,
} from '~/services/workspace/create-remi-setting';
import { notifyError } from '~/utils/notify-error';

export const useCreateRemiSetting = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<ApiError | null>(null);

  const { t } = useTranslation();
  const { useCreateRemiSetting: remiKeys } = localeKeys.settings.remi.hooks;

  const createRemiSettings = async (
    configData: RemiConfigCreateData
  ): Promise<RemiConfigData | null> => {
    if (!workspaceId) {
      return null;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await createRemiSetting(workspaceId, configData);
      setIsCreating(false);
      return response;
    } catch (err) {
      setCreateError(err as ApiError);
      notifyError({ message: t(remiKeys.createError) });
      return null;
    }
  };

  return {
    createRemiSetting: createRemiSettings,
    isCreating,
    createError,
  };
};
