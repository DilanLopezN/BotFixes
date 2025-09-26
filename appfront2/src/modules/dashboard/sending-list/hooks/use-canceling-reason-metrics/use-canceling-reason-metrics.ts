import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import type { CancelingReasonMetric } from '~/interfaces/canceling-reason-metric';
import { getCancelingReasonMetrics } from '~/services/workspace/get-canceling-reason-metrics';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import { notifyError } from '~/utils/notify-error';
import { SendingListQueryString } from '../../interfaces';
import { feedbackEnum } from '../../components/filters-modal/constants';

export const useCancelingReasonMetrics = () => {
  const { workspaceId = '' } = useParams<{
    workspaceId: string;
  }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const [cancelingReasonMetrics, setCancelingReasonMetrics] = useState<CancelingReasonMetric[]>();
  const [isLoadingCancelingReasonMetrics, setIsLoadingCancelingReasonMetrics] = useState(false);
  const [cancelingReasonMetricsError, setCancelingReasonMetricsError] = useState<ApiError>();

  const { startDate, endDate, type, search } = queryStringAsObj;

  const specialityCodeList = useMemo(() => {
    return queryStringAsObj.specialityCodeList?.split(',');
  }, [queryStringAsObj.specialityCodeList]);

  const doctorCodeList = useMemo(() => {
    return queryStringAsObj.doctorCodeList?.split(',');
  }, [queryStringAsObj.doctorCodeList]);

  const statusList = useMemo(() => {
    return queryStringAsObj.statusList?.split(',') as SendingStatus[];
  }, [queryStringAsObj.statusList]);

  const procedureCodeList = useMemo(() => {
    return queryStringAsObj.procedureCodeList?.split(',');
  }, [queryStringAsObj.procedureCodeList]);

  const cancelReasonList = useMemo(() => {
    return queryStringAsObj.cancelReasonList?.split(',');
  }, [queryStringAsObj.cancelReasonList]);

  const organizationUnitList = useMemo(() => {
    return queryStringAsObj.organizationUnitList?.split(',');
  }, [queryStringAsObj.organizationUnitList]);

  const insuranceCodeList = useMemo(() => {
    return queryStringAsObj.insuranceCodeList?.split(',');
  }, [queryStringAsObj.insuranceCodeList]);

  const insurancePlanCodeList = useMemo(() => {
    return queryStringAsObj.insurancePlanCodeList?.split(',');
  }, [queryStringAsObj.insurancePlanCodeList]);

  const npsScoreList = useMemo(() => {
    return queryStringAsObj.npsScoreList?.split(',');
  }, [queryStringAsObj.npsScoreList]);

  const feedback = useMemo(() => {
    return queryStringAsObj.feedback as feedbackEnum | undefined;
  }, [queryStringAsObj.feedback]);

  const fetchCancelingReasonMetrics = useCallback(async () => {
    if (!workspaceId || !startDate || !endDate) {
      return;
    }

    try {
      setIsLoadingCancelingReasonMetrics(true);
      const response = await getCancelingReasonMetrics({
        workspaceId,
        startDate,
        endDate,
        resultType: type || undefined,
        search: search || undefined,
        specialityCodeList: specialityCodeList || undefined,
        doctorCodeList: doctorCodeList || undefined,
        statusList: statusList || undefined,
        procedureCodeList: procedureCodeList || undefined,
        cancelReasonList: cancelReasonList || undefined,
        organizationUnitList: organizationUnitList || undefined,
        insuranceCodeList: insuranceCodeList || undefined,
        insurancePlanCodeList: insurancePlanCodeList || undefined,
        npsScoreList: npsScoreList || undefined,
        feedback: feedback || undefined,
      });
      setCancelingReasonMetrics(response);
      setIsLoadingCancelingReasonMetrics(false);
      return response;
    } catch (err) {
      const typedError = err as ApiError;
      setCancelingReasonMetricsError(typedError);
      setIsLoadingCancelingReasonMetrics(false);
      notifyError('Erro ao carregar métricas de cancelamento');
      return false;
    }
  }, [
    workspaceId,
    startDate,
    endDate,
    type,
    search,
    specialityCodeList,
    doctorCodeList,
    statusList,
    procedureCodeList,
    cancelReasonList,
    organizationUnitList,
    insuranceCodeList,
    insurancePlanCodeList,
    npsScoreList,
    feedback,
  ]);

  useEffect(() => {
    fetchCancelingReasonMetrics();
  }, [fetchCancelingReasonMetrics]);

  return {
    cancelingReasonMetrics,
    isLoadingCancelingReasonMetrics,
    cancelingReasonMetricsError,
    fetchCancelingReasonMetrics,
  };
};
