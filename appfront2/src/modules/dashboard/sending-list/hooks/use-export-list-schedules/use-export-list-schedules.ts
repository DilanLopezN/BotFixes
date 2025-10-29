import { notification } from 'antd';
import { isUndefined, omitBy } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ExportType } from '~/components/export-button';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { exportListSchedulesCsv } from '~/services/workspace/export-list-schedules-csv';
import { ExportableFields } from '~/services/workspace/export-list-schedules-csv/exportable-fields.enum';
import { ScheduleFilterListDto } from '~/services/workspace/export-list-schedules-csv/interfaces';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import type { SendingListQueryString } from '../../interfaces';
import { FeedbackEnum } from '../../constants';

export const useExportSchedules = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const { t } = useTranslation();
  const useExportListSchedulesLocaleKeys =
    localeKeys.dashboard.sendingList.hooks.useExportListSchedules;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  const exportSchedules = useCallback(
    async (downloadType: ExportType, exportColumns: ExportableFields[]) => {
      const filter: ScheduleFilterListDto = {
        startDate: queryStringAsObj.startDate!,
        endDate: queryStringAsObj.endDate!,
        type: queryStringAsObj.type,
        search: queryStringAsObj.search,
        specialityCodeList,
        doctorCodeList,
        statusList,
        procedureCodeList,
        cancelReasonList,
        organizationUnitList,
        insuranceCodeList,
        insurancePlanCodeList,
        npsScoreList,
        feedback: FeedbackEnum.withFeedback,
      };

      try {
        setError(null);
        setIsLoading(true);

        const sanitizedFilter = omitBy(filter, isUndefined) as ScheduleFilterListDto;

        await exportListSchedulesCsv({
          workspaceId,
          filter: sanitizedFilter,
          downloadType,
          selectedColumns: exportColumns,
        });

        notification.success({
          message: t(useExportListSchedulesLocaleKeys.notifySuccessMessage),
          description: t(useExportListSchedulesLocaleKeys.notifySuccessDescription),
        });
      } catch (err) {
        setError(err as Error);
        notification.error({
          message: t(useExportListSchedulesLocaleKeys.notifyErrorMessage),
          description: t(useExportListSchedulesLocaleKeys.notifyErrorDescription),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      queryStringAsObj.startDate,
      queryStringAsObj.endDate,
      queryStringAsObj.type,
      queryStringAsObj.search,
      queryStringAsObj.feedback,
      specialityCodeList,
      doctorCodeList,
      statusList,
      procedureCodeList,
      cancelReasonList,
      organizationUnitList,
      insuranceCodeList,
      insurancePlanCodeList,
      npsScoreList,
      workspaceId,
      t,
      useExportListSchedulesLocaleKeys.notifySuccessMessage,
      useExportListSchedulesLocaleKeys.notifySuccessDescription,
      useExportListSchedulesLocaleKeys.notifyErrorMessage,
      useExportListSchedulesLocaleKeys.notifyErrorDescription,
    ]
  );

  return { isLoading, error, exportSchedules };
};
