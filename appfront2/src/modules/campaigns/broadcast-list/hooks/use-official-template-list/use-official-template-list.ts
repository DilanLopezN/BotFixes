import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { TemplateMessage } from '~/interfaces/template-message';
import { getTemplateListByWorkspaceId } from '~/services/workspace/get-template-list-by-workspace-id';
import { notifyError } from '~/utils/notify-error';
import { serializeQuery } from '~/utils/serialize-query';
import type { UseOfficialTemplateListProps } from './interfaces';

export const useOfficialTemplateList = ({ channelConfigId }: UseOfficialTemplateListProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [officialTemplateList, setOfficialTemplateList] =
    useState<PaginatedModel<TemplateMessage>>();
  const [isLoadingOfficialTemplateList, setIsLoadingOficialTemplateList] = useState(false);
  const [officialTemplateListError, setOfficialTemplateListError] = useState<ApiError>();

  const { t } = useTranslation();

  const useOfficialTemplateListLocaleKeys =
    localeKeys.campaign.broadcastList.hooks.useOfficialTemplateList;

  const fetchOfficialTemplateList = useCallback(async () => {
    if (!workspaceId || !channelConfigId) return;

    const queryString = serializeQuery({
      filter: JSON.stringify({
        isHsm: true,
        $or: [
          {
            active: true,
          },
          {
            active: { $exists: false },
          },
        ],
      }),
      sort: '-createdAt',
      skip: 0,
      channel: channelConfigId,
    });

    try {
      setOfficialTemplateListError(undefined);
      setIsLoadingOficialTemplateList(true);
      const response = await getTemplateListByWorkspaceId(workspaceId, `?${queryString}`);
      setOfficialTemplateList(response);
      setIsLoadingOficialTemplateList(false);
      return true;
    } catch (err) {
      const typedError = err as ApiError;
      setOfficialTemplateListError(typedError);
      setIsLoadingOficialTemplateList(false);
      notifyError(t(useOfficialTemplateListLocaleKeys.notifyError));
      return false;
    }
  }, [channelConfigId, t, useOfficialTemplateListLocaleKeys.notifyError, workspaceId]);

  return {
    officialTemplateList,
    isLoadingOfficialTemplateList,
    officialTemplateListError,
    fetchOfficialTemplateList,
  };
};
