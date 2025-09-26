import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { updateConversationObjective } from '~/services/workspace/update-conversation-objective';
import { notifyError } from '~/utils/notify-error';

export const useEditConversationObjective = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isEditingConversationObjective, setIsEditingConversationObjective] = useState(false);
  const [editConversationObjectiveError, setEditConversationObjectiveError] = useState<ApiError>();

  const { t } = useTranslation();

  const useEditConversationObjectiveLocaleKeys =
    localeKeys.settings.categorization.hooks.useEditConversationObjective;

  const editConversationObjective = async (id: number, name: string) => {
    try {
      setEditConversationObjectiveError(undefined);
      setIsEditingConversationObjective(true);
      await updateConversationObjective(workspaceId, { data: { id, name } });
      setIsEditingConversationObjective(false);
      return true;
    } catch (error) {
      notifyError(t(useEditConversationObjectiveLocaleKeys.editConversationObjectiveError));
      setEditConversationObjectiveError(error as ApiError);
      setIsEditingConversationObjective(false);
      return false;
    }
  };

  return {
    editConversationObjective,
    isEditingConversationObjective,
    editConversationObjectiveError,
  };
};
