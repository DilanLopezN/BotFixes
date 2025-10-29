import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import { WhatsappFlowLibrary } from '~/interfaces/flow-libraries';
import { getFlowLibraryById } from '~/services/channels/get-flow-library-by-id';
import { notifyError } from '~/utils/notify-error';

export const useFlowLibraryById = () => {
  const { workspaceId = '', flowId = '' } = useParams<{
    workspaceId: string;
    flowId: string | undefined;
  }>();
  const [flowLibraryDetail, setFlowLibraryDetail] = useState<WhatsappFlowLibrary>();
  const [isFetchingFlowLibraryDetail, setIsFetchingFlowLibraryDetail] = useState(true);
  const [fetchFlowLibraryDetailError, setFetchFlowLibraryDetailError] = useState<ApiError>();

  const { t } = useTranslation();

  const fetchFlowLibraryDetail = useCallback(async () => {
    const flowLibraryByIdLocaleKeys = localeKeys.settings.whatsAppFlow.hooks.flowLibraryById;
    try {
      setFetchFlowLibraryDetailError(undefined);
      setIsFetchingFlowLibraryDetail(true);
      const response = await getFlowLibraryById(workspaceId, flowId);
      setFlowLibraryDetail(response.data);
      setIsFetchingFlowLibraryDetail(false);
      return true;
    } catch (error) {
      notifyError(t(flowLibraryByIdLocaleKeys.errorMessage));
      setFetchFlowLibraryDetailError(error as ApiError);
      setIsFetchingFlowLibraryDetail(false);
      return false;
    }
  }, [workspaceId, flowId, t]);

  return {
    flowLibraryDetail,
    isFetchingFlowLibraryDetail,
    fetchFlowLibraryDetailError,
    fetchFlowLibraryDetail,
  };
};
