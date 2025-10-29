import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { deactivateFlow } from '~/services/channels/deactivate-flow';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';

export const useDeactivateFlow = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isDeactivatingFlow, setIsDeactivatingFlow] = useState(false);
  const [deactivateFlowError, setDeactivateFlowError] = useState<ApiError>();

  const { t } = useTranslation();

  const handleDeactivateFlow = useCallback(
    async ({ channelConfigId, flowId }: { channelConfigId: string; flowId: number }) => {
      const deactivateFlowLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.deactivateFlow;

      try {
        setDeactivateFlowError(undefined);
        setIsDeactivatingFlow(true);
        const response = await deactivateFlow(workspaceId, { channelConfigId, flowId });
        setIsDeactivatingFlow(false);
        notifySuccess({
          message: t(deactivateFlowLocaleKeys.successMessage),
          description: t(deactivateFlowLocaleKeys.successDescription),
        });
        return response;
      } catch (error) {
        notifyError(t(deactivateFlowLocaleKeys.errorMessage));
        setDeactivateFlowError(error as ApiError);
        setIsDeactivatingFlow(false);
        return null;
      }
    },
    [t, workspaceId]
  );

  return {
    handleDeactivateFlow,
    isDeactivatingFlow,
    deactivateFlowError,
  };
};
