import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { restoreConversationOutcome } from '~/services/workspace/restore-conversation-outcome';
import { notifyError } from '~/utils/notify-error';

export const useRestoreConversationOutcomes = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isRestoringConversationOutcome, setIsRestoringConversationOutcome] = useState(false);
  const [restoreConversationOutcomeError, setRestoreConversationOutcomeError] =
    useState<ApiError>();

  const { t } = useTranslation();

  const useRestoreConversationOutcomeLocaleKeys =
    localeKeys.settings.categorization.hooks.useRestoreConversationOutcome;

  const restoreOutcome = async (conversationOutcomeId: number) => {
    try {
      setRestoreConversationOutcomeError(undefined);
      setIsRestoringConversationOutcome(true);
      await restoreConversationOutcome(workspaceId, conversationOutcomeId);
      setIsRestoringConversationOutcome(false);
      return true;
    } catch (error) {
      notifyError(t(useRestoreConversationOutcomeLocaleKeys.notifyErrorRestore));
      setRestoreConversationOutcomeError(error as ApiError);
      setIsRestoringConversationOutcome(false);
      return false;
    }
  };

  return {
    restoreOutcome,
    isRestoringConversationOutcome,
    restoreConversationOutcomeError,
  };
};
