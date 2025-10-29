import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { deleteConversationOutcomes } from '~/services/workspace/delete-conversation-outcome';
import { notifyError } from '~/utils/notify-error';

export const useRemoveConversationOutcomes = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isRemovingConversationOutcome, setIsRemovingConversationOutcome] = useState(false);
  const [removeConversationOutcomeError, setRemoveConversationOutcomeError] = useState<ApiError>();

  const { t } = useTranslation();

  const useRemoveConversationOutcomesLocaleKeys =
    localeKeys.settings.categorization.hooks.useRemoveConversationOutcomes;

  const removeConversationOutcomes = async (idList: number[]) => {
    try {
      setRemoveConversationOutcomeError(undefined);
      setIsRemovingConversationOutcome(true);
      await deleteConversationOutcomes(workspaceId, idList);
      setIsRemovingConversationOutcome(false);
      return true;
    } catch (error) {
      notifyError(t(useRemoveConversationOutcomesLocaleKeys.notifyErrorRemove));
      setRemoveConversationOutcomeError(error as ApiError);
      setIsRemovingConversationOutcome(false);
      return false;
    }
  };

  return {
    removeConversationOutcomes,
    isRemovingConversationOutcome,
    removeConversationOutcomeError,
  };
};
