import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import type { NpsAnalytic } from '~/services/workspace/get-nps-analytics';
import { getNpsAnalyticsByWorkspaceId } from '~/services/workspace/get-nps-analytics/get-nps-analytics';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import { SendingListQueryString } from '../../interfaces';

export const useNpsAnalytics = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const [npsAnalytics, setNpsAnalytics] = useState<NpsAnalytic[]>();
  const [isLoadingNpsAnalytics, setIsLoadingNpsAnalytics] = useState(true);
  const [npsAnalyticsError, setNpsAnalyticsError] = useState<ApiError>();

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
    return queryStringAsObj.feedback;
  }, [queryStringAsObj.feedback]);

  useEffect(() => {
    const fetchDate = async () => {
      if (!workspaceId || !startDate || !endDate) {
        return;
      }

      try {
        setIsLoadingNpsAnalytics(true);
        const list = await getNpsAnalyticsByWorkspaceId({
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
        setNpsAnalytics(list);
      } catch (err) {
        setNpsAnalyticsError(err as ApiError);
      } finally {
        setIsLoadingNpsAnalytics(false);
      }
    };
    fetchDate();
  }, [
    cancelReasonList,
    doctorCodeList,
    endDate,
    insuranceCodeList,
    insurancePlanCodeList,
    organizationUnitList,
    procedureCodeList,
    search,
    specialityCodeList,
    startDate,
    statusList,
    npsScoreList,
    feedback,
    type,
    workspaceId,
  ]);

  return { npsAnalytics, isLoadingNpsAnalytics, npsAnalyticsError };
};
