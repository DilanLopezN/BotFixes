import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { updateRemiSetting } from '~/services/workspace/update-remi-setting';
import { notifyError } from '~/utils/notify-error';

export const useToggleRemiActive = () => {
  const { workspaceId = '' } = useParams<{
    workspaceId: string;
  }>();
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<ApiError | null>(null);

  const { t } = useTranslation();
  const { useUpdateRemiSetting: remiKeys } = localeKeys.settings.remi.hooks;

  const toggleRemiActive = async (
    remiId: string,
    currentActive: boolean
  ): Promise<RemiConfigData | null> => {
    if (!workspaceId) {
      setToggleError(new Error('Missing workspace ID') as ApiError);
      return null;
    }

    setIsToggling(true);
    setToggleError(null);
    try {
      const response = await updateRemiSetting(workspaceId, remiId, {
        active: !currentActive,
      });
      setIsToggling(false);
      return response;
    } catch (err) {
      setToggleError(err as ApiError);
      notifyError({ message: t(remiKeys.updateError) });
      setIsToggling(false);
      return null;
    }
  };

  return {
    toggleRemiActive,
    isToggling,
    toggleError,
  };
};
