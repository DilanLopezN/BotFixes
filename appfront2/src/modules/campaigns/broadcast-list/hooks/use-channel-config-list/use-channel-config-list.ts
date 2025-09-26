import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { ChannelIdConfig } from '~/constants/channel-id-config';
import type { ApiError } from '~/interfaces/api-error';
import type { ChannelConfig } from '~/interfaces/channel-config';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import { getChannelsConfig } from '~/services/workspace/get-channel-configs';
import { notifyError } from '~/utils/notify-error';
import { serializeQuery } from '~/utils/serialize-query';

export const useChannelConfigList = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [channelConfigList, setChannelConfigList] = useState<PaginatedModel<ChannelConfig>>();
  const [isLoadingChannelConfigList, setIsLoadingChannelConfigList] = useState(false);
  const [channelConfigListError, setChannelConfigListError] = useState<ApiError>();

  const { t } = useTranslation();

  const useChannelConfigListLocaleKeys =
    localeKeys.campaign.broadcastList.hooks.useChannelConfigList;

  const fetchChannelConfigList = useCallback(async () => {
    if (!workspaceId) return;

    const queryString = serializeQuery({
      filter: JSON.stringify({
        workspaceId,
        channelId: ChannelIdConfig.gupshup,
        enable: true,
      }),
    });

    try {
      setChannelConfigListError(undefined);
      setIsLoadingChannelConfigList(true);
      const response = await getChannelsConfig(queryString);
      setChannelConfigList(response);
      setIsLoadingChannelConfigList(false);
      return response;
    } catch (err) {
      const typedError = err as ApiError;
      setChannelConfigListError(typedError);
      setIsLoadingChannelConfigList(false);
      notifyError(t(useChannelConfigListLocaleKeys.notifyError));
      return typedError;
    }
  }, [t, useChannelConfigListLocaleKeys.notifyError, workspaceId]);

  return {
    channelConfigList,
    isLoadingChannelConfigList,
    channelConfigListError,
    fetchChannelConfigList,
  };
};
