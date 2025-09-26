import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { CampaignAction } from '~/interfaces/campaign-actions';
import { getCampaignActionsByWorkspaceId } from '~/services/workspace/get-campaign-actions-by-workspace-id';
import { notifyError } from '~/utils/notify-error';

export const useCampaignActionList = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [campaignActionList, setCampaignActionList] = useState<CampaignAction[]>();
  const [isLoadingCampaignActionList, setIsLoadingCampaignActionList] = useState(true);
  const [campaignActionListError, setCampaignActionListError] = useState<ApiError>();

  const { t } = useTranslation();

  const useCampaignActionListLocaleKeys =
    localeKeys.campaign.broadcastList.hooks.useCampaignActionList;

  const fetchCampaignActionList = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setCampaignActionListError(undefined);
      setIsLoadingCampaignActionList(true);
      const response = await getCampaignActionsByWorkspaceId(workspaceId);
      setCampaignActionList(response);
      setIsLoadingCampaignActionList(false);
      return true;
    } catch (err) {
      const typedError = err as ApiError;
      setCampaignActionListError(typedError);
      setIsLoadingCampaignActionList(false);
      notifyError(t(useCampaignActionListLocaleKeys.notifyError));
      return false;
    }
  }, [t, useCampaignActionListLocaleKeys.notifyError, workspaceId]);

  return {
    campaignActionList,
    isLoadingCampaignActionList,
    campaignActionListError,
    fetchCampaignActionList,
  };
};
