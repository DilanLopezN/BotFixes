import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import {
  getSendingListByWorkspaceId,
  SendingStatus,
  type SendingList,
} from '~/services/workspace/get-sending-list-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { SendingListQueryString } from '../../interfaces';
import { feedbackEnum } from '../../components/filters-modal/constants';

export const useSendingList = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const [sendingList, setSendingList] = useState<SendingList>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const { startDate, endDate, type, search } = queryStringAsObj;
  const currentPage = Number(queryStringAsObj.currentPage || 1);
  const pageSize = Number(queryStringAsObj.pageSize || 10);

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

  const queryString = useMemo(() => {
    if (!pageSize || !currentPage) {
      return '';
    }

    const limitedPageSize = Math.min(pageSize, 100);

    const qString = createQueryString({
      limit: limitedPageSize,
      skip: Math.max(currentPage - 1, 0) * limitedPageSize,
    });
    return qString;
  }, [currentPage, pageSize]);

  const fetchData = useCallback(async () => {
    if (!workspaceId || !startDate || !endDate) return;

    try {
      setError(undefined);
      setIsLoading(true);

      const response = await getSendingListByWorkspaceId(
        {
          workspaceId,
          startDate,
          endDate,
          type: type || undefined,
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
        },
        queryString
      );

      setSendingList(response);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
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
    queryString,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sendingList, isLoading, error, fetchData };
};
