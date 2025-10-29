import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { createConversationObjectiveById } from '~/services/workspace/create-conversation-objective-by-id';
import { notifyError } from '~/utils/notify-error';
import { ApiErrorType } from '../../constants';

export const useCreateConversationObjective = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreatingConversationObjective, setIsCreatingConversationObjective] = useState(false);
  const [createConversationObjectiveError, setCreateConversationObjectiveError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const useCreateConversationObjectiveLocaleKeys =
    localeKeys.settings.categorization.hooks.useCreateConversationObjective;

  const createConversationObjective = async (name: string) => {
    try {
      setCreateConversationObjectiveError(undefined);
      setIsCreatingConversationObjective(true);
      await createConversationObjectiveById(workspaceId, { data: { name } });
      setIsCreatingConversationObjective(false);
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (
          error.response?.data.error === ApiErrorType.CONVERSATION_OBJECTIVE_NAME_ALREADY_EXISTS
        ) {
          notifyError(t(useCreateConversationObjectiveLocaleKeys.notifyErrorObjective));
        } else {
          notifyError(t(useCreateConversationObjectiveLocaleKeys.notifyErrorCreate));
        }
        setCreateConversationObjectiveError(error as ApiError);
      }
      setIsCreatingConversationObjective(false);

      return false;
    }
  };

  return {
    createConversationObjective,
    isCreatingConversationObjective,
    createConversationObjectiveError,
  };
};
