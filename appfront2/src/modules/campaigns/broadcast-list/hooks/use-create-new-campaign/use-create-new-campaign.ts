import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { createNewCampaign } from '~/services/workspace/create-new-campaign';
import type { CreateNewCampaignProps } from '~/services/workspace/create-new-campaign/interfaces';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';

export const useCreateNewCampaign = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreatingNewCampaign, setIsCreatingNewCampaign] = useState(false);
  const [creatingNewCampaignError, setCreatingNewCampaignerror] = useState<ApiError>();

  const { t } = useTranslation();

  const useCreateNewCampaignLocaleKeys =
    localeKeys.campaign.broadcastList.hooks.useCreateNewCampaign;

  const createCampaign = useCallback(
    async (params: CreateNewCampaignProps) => {
      if (!workspaceId) return;

      try {
        setCreatingNewCampaignerror(undefined);
        setIsCreatingNewCampaign(true);
        const response = await createNewCampaign(workspaceId, params);
        setIsCreatingNewCampaign(false);
        notifySuccess({
          message: t(useCreateNewCampaignLocaleKeys.notifySuccessMessage),
          description: t(useCreateNewCampaignLocaleKeys.notifySuccessDescription),
        });
        return response;
      } catch (err) {
        const typedError = err as ApiError;
        setCreatingNewCampaignerror(typedError);
        setIsCreatingNewCampaign(false);
        notifyError(t(useCreateNewCampaignLocaleKeys.notifyError));
        return typedError;
      }
    },
    [
      t,
      useCreateNewCampaignLocaleKeys.notifyError,
      useCreateNewCampaignLocaleKeys.notifySuccessDescription,
      useCreateNewCampaignLocaleKeys.notifySuccessMessage,
      workspaceId,
    ]
  );

  return {
    isCreatingNewCampaign,
    creatingNewCampaignError,
    createCampaign,
  };
};
