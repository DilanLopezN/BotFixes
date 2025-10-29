import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { WhatsappFlowLibrary } from '~/interfaces/flow-libraries';
import { getFlowLibraries } from '~/services/channels/get-flow-libraries';
import { GetFlowLibrariesParams } from '~/services/channels/get-flow-libraries/interfaces';
import { notifyError } from '~/utils/notify-error';
import { WhatsAppFlowQueryStrings } from '../../interfaces';

export const useFlowLibraries = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<WhatsAppFlowQueryStrings>();

  const [flowLibraries, setFlowLibraries] = useState<WhatsappFlowLibrary[]>([]);
  const [isFetchingFlowLibraries, setIsFetchingFlowLibraries] = useState(true);
  const [fetchFlowLibrariesError, setFetchFlowLibrariesError] = useState<ApiError>();

  const { t } = useTranslation();

  const fetchFlowLibraries = useCallback(async () => {
    const flowLibrariesLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.flowLibraries;

    try {
      const { categoriesIds, ...rest } = queryStringAsObj;

      const filters: GetFlowLibrariesParams = {
        ...rest,
        flowCategoryIds: categoriesIds
          ? categoriesIds.split(',').map((id) => Number(id.trim()))
          : undefined,
        search: rest.search,
        channelStatus: rest.channelStatus
          ? rest.channelStatus.split(',').map((status) => status.trim())
          : undefined,
      };

      setFetchFlowLibrariesError(undefined);
      setIsFetchingFlowLibraries(true);
      const response = await getFlowLibraries(workspaceId, filters);
      setFlowLibraries(response.data);
      setIsFetchingFlowLibraries(false);
      return true;
    } catch (error) {
      notifyError(t(flowLibrariesLocaleKeys.errorMessage));
      setFetchFlowLibrariesError(error as ApiError);
      setIsFetchingFlowLibraries(false);
      return false;
    }
  }, [queryStringAsObj, workspaceId, t]);

  useEffect(() => {
    if (workspaceId) {
      fetchFlowLibraries();
    }
  }, [fetchFlowLibraries, workspaceId]);

  return {
    flowLibraries,
    isFetchingFlowLibraries,
    fetchFlowLibrariesError,
    fetchFlowLibraries,
  };
};
