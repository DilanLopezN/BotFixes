import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import {
  getScheduleAnalyticsByWorkspaceId,
  type ScheduleAnalytics,
} from '~/services/workspace/get-schedule-analytics';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import { SendingListQueryString } from '../../interfaces';

export const useScheduleAnalytics = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const [scheduleAnalytics, setScheduleAnalytics] = useState<ScheduleAnalytics>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

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
        setIsLoading(true);
        const list = await getScheduleAnalyticsByWorkspaceId({
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
        setScheduleAnalytics(list);
      } catch (err) {
        setError(err as ApiError);
      } finally {
        setIsLoading(false);
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
    type,
    workspaceId,
    feedback,
  ]);

  return { scheduleAnalytics, isLoading, error };
};
