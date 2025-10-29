import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import type { ApiError } from '~/interfaces/api-error';
import { getActiveMessageListByWorkspaceId } from '~/services/workspace/get-active-message-list-by-workspace-id';
import { notifyError } from '~/utils/notify-error';

export const useActiveMessageList = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [activeMessageList, setActiveMessageList] = useState<ActiveMessageSetting[]>();
  const [isLoadingActiveMessageList, setIsLoadingActiveMessageList] = useState(true);
  const [activeMessageError, setActiveMessageListError] = useState<ApiError>();

  const { t } = useTranslation();

  const useActiveMessageListLocaleKeys =
    localeKeys.campaign.broadcastList.hooks.useActiveMessageList;

  const fetchActiveMessageList = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setActiveMessageListError(undefined);
      setIsLoadingActiveMessageList(true);
      const response = await getActiveMessageListByWorkspaceId(workspaceId, '?objective=campaign');
      setActiveMessageList(response);
      setIsLoadingActiveMessageList(false);
      return response;
    } catch (err) {
      const typedError = err as ApiError;
      setActiveMessageListError(typedError);
      setIsLoadingActiveMessageList(false);
      notifyError(t(useActiveMessageListLocaleKeys.notifyError));
      return err;
    }
  }, [t, useActiveMessageListLocaleKeys.notifyError, workspaceId]);

  return {
    activeMessageList,
    isLoadingActiveMessageList,
    activeMessageError,
    fetchActiveMessageList,
  };
};
