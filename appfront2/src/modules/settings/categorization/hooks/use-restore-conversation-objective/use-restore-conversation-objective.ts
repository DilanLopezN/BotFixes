import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { restoreConversationObjective } from '~/services/workspace/restore-conversation-objective';
import { notifyError } from '~/utils/notify-error';

export const useRestoreConversationObjectives = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isRestoringConversationObjective, setIsRestoringConversationObjective] = useState(false);
  const [restoreConversationObjectiveError, setRestoreConversationObjectiveError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const useRestoreConversationObjectiveLocaleKeys =
    localeKeys.settings.categorization.hooks.useRestoreConversationObjective;

  const restoreObjective = async (conversationObjectiveId: number) => {
    try {
      setRestoreConversationObjectiveError(undefined);
      setIsRestoringConversationObjective(true);
      await restoreConversationObjective(workspaceId, conversationObjectiveId);
      setIsRestoringConversationObjective(false);
      return true;
    } catch (error) {
      notifyError(t(useRestoreConversationObjectiveLocaleKeys.notifyErrorRestore));
      setRestoreConversationObjectiveError(error as ApiError);
      setIsRestoringConversationObjective(false);
      return false;
    }
  };

  return {
    restoreObjective,
    isRestoringConversationObjective,
    restoreConversationObjectiveError,
  };
};
