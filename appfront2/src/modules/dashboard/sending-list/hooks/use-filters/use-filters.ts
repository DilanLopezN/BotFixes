import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SendingType } from '~/constants/sending-type';
import { useQueryString } from '~/hooks/use-query-string';
import { SendingListQueryParams } from '~/interfaces/send-list-query-params';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import { FeedbackEnum, RecipientTypeEnum } from '../../constants';
import { SendingListQueryString } from '../../interfaces';
import { STATUS_ALLOWED_MAP } from './constants';

export const useFilters = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();

  const { startDate, endDate, type, search, aliasSettingId } = queryStringAsObj;

  const specialityCodeList = useMemo(() => {
    return queryStringAsObj.specialityCodeList?.split(',');
  }, [queryStringAsObj.specialityCodeList]);

  const doctorCodeList = useMemo(() => {
    return queryStringAsObj.doctorCodeList?.split(',');
  }, [queryStringAsObj.doctorCodeList]);

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
    return queryStringAsObj.feedback as FeedbackEnum | undefined;
  }, [queryStringAsObj.feedback]);

  const recipientType = useMemo(() => {
    return queryStringAsObj.recipientType as RecipientTypeEnum | undefined;
  }, [queryStringAsObj.recipientType]);

  const filters = useMemo(() => {
    const statusListFromQuery = queryStringAsObj.statusList?.split(',') as SendingStatus[];

    let filteredStatusList = statusListFromQuery;
    if (type && statusListFromQuery) {
      filteredStatusList = statusListFromQuery.filter(
        (status) => STATUS_ALLOWED_MAP[status]?.includes(type as SendingType)
      );
    }

    const baseFilters: SendingListQueryParams = {
      workspaceId,
      startDate,
      endDate,
      type: type || undefined,
      search: search || undefined,
      specialityCodeList: specialityCodeList || undefined,
      doctorCodeList: doctorCodeList || undefined,
      statusList: filteredStatusList?.length > 0 ? filteredStatusList : undefined,
      procedureCodeList: procedureCodeList || undefined,
      organizationUnitList: organizationUnitList || undefined,
      insuranceCodeList: insuranceCodeList || undefined,
      insurancePlanCodeList: insurancePlanCodeList || undefined,
      recipientType: recipientType || undefined,
      getGroup: queryStringAsObj.getGroup ? queryStringAsObj.getGroup !== 'true' : false,
      aliasSettingId: aliasSettingId || undefined,
    };

    if (type === undefined || type === SendingType.confirmation) {
      baseFilters.cancelReasonList = cancelReasonList || undefined;
    }

    if (type === undefined || type === SendingType.nps_score) {
      baseFilters.npsScoreList = npsScoreList || undefined;
      baseFilters.feedback = feedback || undefined;
    }

    return baseFilters;
  }, [
    aliasSettingId,
    cancelReasonList,
    doctorCodeList,
    endDate,
    feedback,
    insuranceCodeList,
    insurancePlanCodeList,
    npsScoreList,
    organizationUnitList,
    procedureCodeList,
    queryStringAsObj.getGroup,
    queryStringAsObj.statusList,
    recipientType,
    search,
    specialityCodeList,
    startDate,
    type,
    workspaceId,
  ]);

  return filters;
};
