import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { activateFlow } from '~/services/channels/activate-flow';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';

export const useActivateFlow = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isActivatingFlow, setIsActivatingFlow] = useState(false);
  const [activateFlowError, setActivateFlowError] = useState<ApiError>();

  const { t } = useTranslation();

  const handleActivateFlow = useCallback(
    async ({ channelConfigId, flowId }: { channelConfigId: string; flowId: number }) => {
      const activateFlowLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.activateFlow;
      try {
        setActivateFlowError(undefined);
        setIsActivatingFlow(true);
        const response = await activateFlow(workspaceId, { channelConfigId, flowId });
        setIsActivatingFlow(false);
        notifySuccess({
          message: t(activateFlowLocaleKeys.successMessage),
          description: t(activateFlowLocaleKeys.successDescription),
        });
        return response;
      } catch (error) {
        notifyError(t(activateFlowLocaleKeys.errorMessage));
        setActivateFlowError(error as ApiError);
        setIsActivatingFlow(false);
        return null;
      }
    },
    [workspaceId, t]
  );

  return {
    handleActivateFlow,
    isActivatingFlow,
    activateFlowError,
  };
};
