import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { ConversationOutcome } from '~/interfaces/conversation-outcome';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { getConversationOutcomes } from '~/services/workspace/get-conversation-outcomes';
import { notifyError } from '~/utils/notify-error';

export const useConversationOutcomes = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [conversationOutcomes, setConversationOutcomes] =
    useState<NewResponseModel<ConversationOutcome[]>>();
  const [isFetchingConversationOutcomes, setIsFetchingConversationOutcomes] = useState(true);
  const [fetchConversationOutcomesError, setFetchConversationOutcomesError] = useState<ApiError>();

  const { t } = useTranslation();

  const useConversationOutcomesLocaleKeys =
    localeKeys.settings.categorization.hooks.useConversationOutcomes;

  const fetchConversationOutcomes = useCallback(async () => {
    try {
      setFetchConversationOutcomesError(undefined);
      setIsFetchingConversationOutcomes(true);
      const result = await getConversationOutcomes(workspaceId, { data: {} });
      setConversationOutcomes(result);
      setIsFetchingConversationOutcomes(false);
      return true;
    } catch (error) {
      notifyError(t(useConversationOutcomesLocaleKeys.reloadOutcomeError));
      setFetchConversationOutcomesError(error as ApiError);
      setIsFetchingConversationOutcomes(false);
      return false;
    }
  }, [useConversationOutcomesLocaleKeys.reloadOutcomeError, t, workspaceId]);

  useEffect(() => {
    fetchConversationOutcomes();
  }, [fetchConversationOutcomes]);

  return {
    fetchConversationOutcomes,
    conversationOutcomes,
    isFetchingConversationOutcomes,
    fetchConversationOutcomesError,
  };
};
