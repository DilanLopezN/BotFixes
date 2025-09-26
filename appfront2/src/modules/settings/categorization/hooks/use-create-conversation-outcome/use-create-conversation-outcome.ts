import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { createConversationOutcome } from '~/services/workspace/create-conversation-outcome';
import { notifyError } from '~/utils/notify-error';
import { ApiErrorType } from '../../constants';

export const useCreateConversationOutcome = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreatingConversationOutcome, setIsCreatingConversationOutcome] = useState(false);
  const [createConversationOutcomeError, setCreateConversationOutcomeError] = useState<ApiError>();

  const { t } = useTranslation();

  const useCreateConversationOutcomeLocaleKeys =
    localeKeys.settings.categorization.hooks.useCreateConversationOutcome;

  const createOutcome = async (name: string) => {
    try {
      setCreateConversationOutcomeError(undefined);
      setIsCreatingConversationOutcome(true);
      await createConversationOutcome(workspaceId, { data: { name } });
      setIsCreatingConversationOutcome(false);
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data.error === ApiErrorType.CONVERSATION_OUTCOME_NAME_ALREADY_EXISTS) {
          notifyError(t(useCreateConversationOutcomeLocaleKeys.notifyErrorOutcome));
        } else {
          notifyError(t(useCreateConversationOutcomeLocaleKeys.notifyErrorCreate));
        }
        setCreateConversationOutcomeError(error as ApiError);
      }
      setIsCreatingConversationOutcome(false);
      return false;
    }
  };

  return {
    createConversationOutcome: createOutcome,
    isCreatingConversationOutcome,
    createConversationOutcomeError,
  };
};
