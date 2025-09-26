import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { ConversationObjective } from '~/interfaces/conversation-objective';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { getConversationObjectives } from '~/services/workspace/get-conversation-objectives';
import { notifyError } from '~/utils/notify-error';

export const useConversationObjectives = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [conversationObjectives, setConversationObjectives] =
    useState<NewResponseModel<ConversationObjective[]>>();
  const [isFetchingConversationObjectives, setIsFetchingConversationObjectives] = useState(true);
  const [fetchConversationObjectivesError, setFetchConversationObjectivesError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const useConversationObjectivesLocaleKeys =
    localeKeys.settings.categorization.hooks.useConversationObjectives;

  const fetchConversationObjective = useCallback(async () => {
    try {
      setFetchConversationObjectivesError(undefined);
      setIsFetchingConversationObjectives(true);
      const response = await getConversationObjectives(workspaceId, { data: {} });
      setConversationObjectives(response);
      setIsFetchingConversationObjectives(false);
      return true;
    } catch (error) {
      notifyError(t(useConversationObjectivesLocaleKeys.reloadObjectivesError));
      setFetchConversationObjectivesError(error as ApiError);
      setIsFetchingConversationObjectives(false);
      return false;
    }
  }, [useConversationObjectivesLocaleKeys.reloadObjectivesError, t, workspaceId]);

  useEffect(() => {
    fetchConversationObjective();
  }, [fetchConversationObjective]);

  return {
    conversationObjectives,
    isFetchingConversationObjectives,
    fetchConversationObjectivesError,
    fetchConversationObjective,
  };
};
