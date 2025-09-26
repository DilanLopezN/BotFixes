import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import type { ApiError } from '~/interfaces/api-error';
import { updateWorkspaceById } from '~/services/workspace/update-workspace-by-id';
import { notifyError } from '~/utils/notify-error';
import { ApiErrorType } from '../../constants';

export const useEnableCategorization = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { name } = useSelectedWorkspace();
  const [isActivatingCategorization, setIsActivatingCategorization] = useState(false);
  const [activatingCategorizationError, setActivatingCategorizationError] = useState<ApiError>();

  const { t } = useTranslation();

  const useEnableCategorizationLocaleKeys =
    localeKeys.settings.categorization.hooks.useEnableCategorization;

  const activateCategorization = useCallback(
    async (enableConversationCategorization: boolean) => {
      if (isActivatingCategorization) return;

      try {
        setActivatingCategorizationError(undefined);
        setIsActivatingCategorization(true);
        await updateWorkspaceById({
          _id: workspaceId,
          name,
          userFeatureFlag: { enableConversationCategorization },
        });
        setIsActivatingCategorization(false);
        return true;
      } catch (error) {
        if (error instanceof AxiosError) {
          if (
            error.response?.data.error === ApiErrorType.CONVERSATION_OBJECTIVE_AND_OUTCOME_NEEDED
          ) {
            notifyError(t(useEnableCategorizationLocaleKeys.notifyErrorCategorization));
          } else {
            notifyError(t(useEnableCategorizationLocaleKeys.createOutcomeError));
          }
          setActivatingCategorizationError(error as ApiError);
        }

        setIsActivatingCategorization(false);
        return false;
      }
    },
    [
      useEnableCategorizationLocaleKeys.createOutcomeError,
      useEnableCategorizationLocaleKeys.notifyErrorCategorization,
      isActivatingCategorization,
      name,
      t,
      workspaceId,
    ]
  );

  return {
    isActivatingCategorization,
    activatingCategorizationError,
    activateCategorization,
  };
};
