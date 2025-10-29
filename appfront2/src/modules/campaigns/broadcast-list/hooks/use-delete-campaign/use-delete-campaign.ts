import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { deleteCampaignById } from '~/services/workspace/delete-campaign-by-id';
import { notifyError } from '~/utils/notify-error';

export const useDeleteCampaign = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [campaignDeletingError, setCampaignDeletingError] = useState<ApiError>();

  const { t } = useTranslation();

  const useDeleteCampaignLocaleKeys = localeKeys.campaign.broadcastList.hooks.useDeleteCampaign;

  const deleteCampaign = useCallback(
    async (campaignId: number) => {
      try {
        setIsDeleting(true);
        await deleteCampaignById(workspaceId, campaignId);
        setIsDeleting(false);
        return true;
      } catch (err) {
        setCampaignDeletingError(err as ApiError);
        setIsDeleting(false);
        notifyError(t(useDeleteCampaignLocaleKeys.notifyError));
        return false;
      }
    },
    [t, useDeleteCampaignLocaleKeys.notifyError, workspaceId]
  );

  return { isDeleting, campaignDeletingError, deleteCampaign };
};
