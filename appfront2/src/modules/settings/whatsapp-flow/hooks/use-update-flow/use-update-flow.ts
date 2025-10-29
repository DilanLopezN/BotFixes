import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ApiError } from '~/interfaces/api-error';
import { updateFlow } from '~/services/channels/update-flow';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';

export const useUpdateFlow = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdatingFlow, setIsUpdatingFlow] = useState(false);
  const [updateFlowError, setUpdateFlowError] = useState<ApiError>();

  const { t } = useTranslation();

  const handleUpdateFlow = useCallback(
    async (flowId: number, flowData: any) => {
      const updateFlowLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.updateFlow;

      try {
        setUpdateFlowError(undefined);
        setIsUpdatingFlow(true);

        const response = await updateFlow(workspaceId, flowId, flowData);

        setIsUpdatingFlow(false);
        notifySuccess({
          message: t(updateFlowLocaleKeys.successMessage),
          description: t(updateFlowLocaleKeys.successDescription),
        });
        return response;
      } catch (error) {
        notifyError(t(updateFlowLocaleKeys.errorMessage));
        setUpdateFlowError(error as ApiError);
        setIsUpdatingFlow(false);
        return null;
      }
    },
    [workspaceId, t]
  );

  return {
    handleUpdateFlow,
    isUpdatingFlow,
    updateFlowError,
  };
};
