import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { updateCampaignById } from '~/services/workspace/update-campaign-by-id';
import type { UpdateCampaignByIdProps } from '~/services/workspace/update-campaign-by-id/interfaces';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';

export const useUpdateCampaignById = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState(false);
  const [updateCampaignError, setUpdateCampaignerror] = useState<ApiError>();

  const { t } = useTranslation();

  const useUpdateCampaignByIdLocaleKeys =
    localeKeys.campaign.broadcastList.hooks.useUpdateCampaignById;

  const updateCampaign = useCallback(
    async (params: UpdateCampaignByIdProps) => {
      if (!workspaceId) return;

      try {
        setUpdateCampaignerror(undefined);
        setIsUpdatingCampaign(true);
        const response = await updateCampaignById(workspaceId, params);
        setIsUpdatingCampaign(false);
        notifySuccess({
          message: t(useUpdateCampaignByIdLocaleKeys.notifySuccessMessage),
          description: t(useUpdateCampaignByIdLocaleKeys.notifySuccessDescription),
        });
        return response;
      } catch (err) {
        const typedError = err as ApiError;
        setUpdateCampaignerror(typedError);
        setIsUpdatingCampaign(false);
        notifyError(t(useUpdateCampaignByIdLocaleKeys.notifyError));
        return typedError;
      }
    },
    [
      t,
      useUpdateCampaignByIdLocaleKeys.notifyError,
      useUpdateCampaignByIdLocaleKeys.notifySuccessDescription,
      useUpdateCampaignByIdLocaleKeys.notifySuccessMessage,
      workspaceId,
    ]
  );

  return {
    isUpdatingCampaign,
    updateCampaignError,
    updateCampaign,
  };
};
