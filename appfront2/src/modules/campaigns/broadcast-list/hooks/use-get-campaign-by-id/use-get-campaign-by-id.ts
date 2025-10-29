import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { routes } from '~/routes';
import { getCampaignById } from '~/services/workspace/get-campaign-by-id';
import type { GetCampaignResponse } from '~/services/workspace/get-campaign-by-id/interfaces';
import { notifyError } from '~/utils/notify-error';

export const useGetCampaignById = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [campaign, setCampaign] = useState<NewResponseModel<GetCampaignResponse>>();
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<ApiError>();
  const navigate = useNavigate();

  const { children: broadcastListModules } =
    routes.modules.children.campaigns.children.broadcastList;

  const viewListsPath = generatePath(broadcastListModules.viewBroadcastList.fullPath, {
    workspaceId,
  });

  const { t } = useTranslation();

  const useGetCampaignByIdLocaleKeys = localeKeys.campaign.broadcastList.hooks.useGetCampaignById;

  const fetchCampaignById = useCallback(
    async (campaignId: number) => {
      try {
        setIsLoadingCampaign(true);
        const response = await getCampaignById(workspaceId, campaignId);
        setCampaign(response);
        setIsLoadingCampaign(false);
        return response;
      } catch (err) {
        const typedError = err as ApiError;
        setCampaignError(typedError);
        setIsLoadingCampaign(false);
        notifyError(t(useGetCampaignByIdLocaleKeys.notifyError));
        navigate(viewListsPath);
        return false;
      }
    },
    [navigate, t, useGetCampaignByIdLocaleKeys.notifyError, viewListsPath, workspaceId]
  );

  return {
    campaign,
    isLoadingCampaign,
    campaignError,
    fetchCampaignById,
  };
};
