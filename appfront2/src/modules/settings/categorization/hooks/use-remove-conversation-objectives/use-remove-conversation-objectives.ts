import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { deleteConversationObjectives } from '~/services/workspace/delete-conversation-objectives';
import { notifyError } from '~/utils/notify-error';

export const useRemoveConversationObjectives = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isRemovingConversationObjective, setIsRemovingConversationObjective] = useState(false);
  const [removeConversationObjectiveError, setRemoveConversationObjectiveError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const useRemoveConversationObjectivesLocaleKeys =
    localeKeys.settings.categorization.hooks.useRemoveConversationObjectives;

  const removeConversationObjectives = async (idList: number[]) => {
    try {
      setRemoveConversationObjectiveError(undefined);
      setIsRemovingConversationObjective(true);
      await deleteConversationObjectives(workspaceId, idList);
      setIsRemovingConversationObjective(false);
      return true;
    } catch (error) {
      notifyError(t(useRemoveConversationObjectivesLocaleKeys.removeObjectivesError));
      setRemoveConversationObjectiveError(error as ApiError);
      setIsRemovingConversationObjective(false);
      return false;
    }
  };

  return {
    removeConversationObjectives,
    isRemovingConversationObjective,
    removeConversationObjectiveError,
  };
};
