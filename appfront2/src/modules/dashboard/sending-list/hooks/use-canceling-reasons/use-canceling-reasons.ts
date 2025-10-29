import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import type { ApiError } from '~/interfaces/api-error';
import type { CancelingReason } from '~/interfaces/canceling-reason';
import { getCancelingReasons } from '~/services/workspace/get-canceling-reasons';
import { notifyError } from '~/utils/notify-error';
import type { UseCancelingReasonsProps } from './interfaces';

export const useCancelingReasons = ({
  currentPage,
  searchInputValue,
}: UseCancelingReasonsProps) => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [cancelingReasons, setCancelingReasons] = useState<CancelingReason[]>();
  const [isLoadingCancelingReasons, setIsLoadingCancelingReasons] = useState(false);
  const [cancelingReasonsError, setCancelingReasonsError] = useState<ApiError>();
  const { t } = useTranslation();
  const useCancelingReasonsLocaleKeys = localeKeys.dashboard.sendingList.hooks.useCancelingReasons;

  const fetchCancelingReasons = useCallback(async () => {
    try {
      setIsLoadingCancelingReasons(true);
      const response = await getCancelingReasons(workspaceId);
      setCancelingReasons(response);
      setIsLoadingCancelingReasons(false);
      return response;
    } catch (err) {
      const typedError = err as ApiError;
      setCancelingReasonsError(typedError);
      setIsLoadingCancelingReasons(false);
      notifyError(t(useCancelingReasonsLocaleKeys.notifyError));
      return false;
    }
  }, [t, useCancelingReasonsLocaleKeys.notifyError, workspaceId]);

  return {
    cancelingReasons,
    isLoadingCancelingReasons,
    cancelingReasonsError,
    fetchCancelingReasons,
  };
};
