import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { createFlow } from '~/services/channels/create-flow';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';

export const useCreateFlow = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [createFlowError, setCreateFlowError] = useState<ApiError>();

  const { t } = useTranslation();

  const handleCreateFlow = useCallback(
    async (payload: any) => {
      const createFlowLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.createFlow;

      try {
        setCreateFlowError(undefined);
        setIsCreatingFlow(true);
        const response = await createFlow(workspaceId, payload);
        setIsCreatingFlow(false);
        notifySuccess({
          message: t(createFlowLocaleKeys.successMessage),
          description: t(createFlowLocaleKeys.successDescription),
        });
        return response;
      } catch (error) {
        notifyError(t(createFlowLocaleKeys.errorMessage));
        setCreateFlowError(error as ApiError);
        setIsCreatingFlow(false);
        return null;
      }
    },
    [workspaceId, t]
  );

  return {
    handleCreateFlow,
    isCreatingFlow,
    createFlowError,
  };
};
