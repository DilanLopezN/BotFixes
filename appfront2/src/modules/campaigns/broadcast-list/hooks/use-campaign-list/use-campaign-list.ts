import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { Campaign } from '~/interfaces/campaign';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { getCampaignListByWorkspaceId } from '~/services/workspace/get-campaign-list-by-workspace-id';
import { notifyError } from '~/utils/notify-error';
import type { UseCampaignListProps } from './interfaces';

export const useCampaignList = ({
  startDate,
  endDate,
  search,
  status,
  currentPage,
  pageSize,
  hasFail,
  isTest,
}: UseCampaignListProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [campaignList, setCampaignList] = useState<NewResponseModel<Partial<Campaign[]>>>();
  const [isLoadingCampaignList, setIsLoadingCampaignList] = useState(true);
  const [campaignListError, setCampaignListError] = useState<ApiError>();

  const { t } = useTranslation();

  const useCampaignListLocaleKeys = localeKeys.campaign.broadcastList.hooks.useCampaignList;

  const fetchCampaignList = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setCampaignListError(undefined);
      setIsLoadingCampaignList(true);
      const response = await getCampaignListByWorkspaceId(workspaceId, {
        limit: pageSize,
        skip: Math.max(currentPage - 1, 0) * pageSize,
        data: {
          startDate: startDate && startDate.valueOf(),
          endDate: endDate && endDate.valueOf(),
          status,
          name: search,
          hasFail: hasFail || undefined,
          isTest: isTest || undefined,
        },
      });
      setCampaignList(response);
      setIsLoadingCampaignList(false);
      return true;
    } catch (err) {
      const typedError = err as ApiError;
      setCampaignListError(typedError);
      setIsLoadingCampaignList(false);
      notifyError(t(useCampaignListLocaleKeys.notifyError));
      return false;
    }
  }, [
    currentPage,
    endDate,
    hasFail,
    isTest,
    pageSize,
    search,
    startDate,
    status,
    t,
    useCampaignListLocaleKeys.notifyError,
    workspaceId,
  ]);

  return {
    campaignList,
    isLoadingCampaignList,
    campaignListError,
    fetchCampaignList,
  };
};
