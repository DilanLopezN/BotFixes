import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { updateConversationOutcome } from '~/services/workspace/update-conversation-outcome';
import { notifyError } from '~/utils/notify-error';

export const useEditConversationOutcome = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isEditingConversationOutcome, setIsEditingConversationOutcome] = useState(false);
  const [editConversationOutcomeError, setEditConversationOutcomeError] = useState<ApiError>();

  const { t } = useTranslation();

  const useEditConversationOutcomeLocaleKeys =
    localeKeys.settings.categorization.hooks.useEditConversationOutcome;
  const editConversationOutcome = async (id: number, name: string) => {
    try {
      setEditConversationOutcomeError(undefined);
      setIsEditingConversationOutcome(true);
      await updateConversationOutcome(workspaceId, { data: { id, name } });
      setIsEditingConversationOutcome(false);
      return true;
    } catch (error) {
      notifyError(t(useEditConversationOutcomeLocaleKeys.editConversationOutcomeError));
      setEditConversationOutcomeError(error as ApiError);
      setIsEditingConversationOutcome(false);
      return false;
    }
  };

  return {
    editConversationOutcome,
    isEditingConversationOutcome,
    editConversationOutcomeError,
  };
};
