import { notification } from 'antd';
import { isUndefined, omitBy } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import { exportListSchedulesCsv } from '~/services/workspace/export-list-schedules-csv';
import { ScheduleFilterListDto } from '~/services/workspace/export-list-schedules-csv/interfaces';
import { TypeDownloadEnum } from '~/services/workspace/export-list-schedules-csv/type-download-enum';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';
import type { SendingListQueryString } from '../../interfaces';

export const useExportSchedules = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
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
    async (downloadType: TypeDownloadEnum) => {
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
      };

      try {
        setError(null);
        setIsLoading(true);

        const sanitizedFilter = omitBy(filter, isUndefined) as ScheduleFilterListDto;

        await exportListSchedulesCsv({
          workspaceId,
          filter: sanitizedFilter,
          downloadType,
        });

        notification.success({
          message: 'Exportação iniciada',
          description: 'O download do arquivo foi iniciado com sucesso.',
        });
      } catch (err) {
        setError(err as Error);
        notification.error({
          message: 'Erro ao exportar',
          description: 'Ocorreu um erro ao tentar exportar os dados. Tente novamente mais tarde.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      cancelReasonList,
      doctorCodeList,
      insuranceCodeList,
      insurancePlanCodeList,
      organizationUnitList,
      procedureCodeList,
      queryStringAsObj.endDate,
      queryStringAsObj.search,
      queryStringAsObj.startDate,
      queryStringAsObj.type,
      specialityCodeList,
      statusList,
      npsScoreList,
      workspaceId,
    ]
  );

  return { isLoading, error, exportSchedules };
};
