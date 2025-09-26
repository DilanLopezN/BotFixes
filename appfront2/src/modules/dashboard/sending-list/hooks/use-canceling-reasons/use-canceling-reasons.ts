import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
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
      notifyError('Erro ao carregar lista de motivos de cancelamento');
      return false;
    }
  }, [workspaceId]);

  return {
    cancelingReasons,
    isLoadingCancelingReasons,
    cancelingReasonsError,
    fetchCancelingReasons,
  };
};
