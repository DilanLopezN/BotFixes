import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { getExcessiveBreaksCsv } from '~/services/workspace/get-excessive-breaks-csv';
import { downloadFile } from '~/utils/download-file';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useFilters } from '../use-filters';

export const useExcessiveBreaksCsv = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [isDownloadingExcessiveBreaksCsv, setIsDownloadingExcessiveBreaksCsv] = useState(false);
  const [downloadingExcessiveBreaksError, setDownloadingExcessiveBreaksError] =
    useState<ApiError>();

  const downloadExcessiveBreaksCsv = useCallback(async () => {
    if (isDownloadingExcessiveBreaksCsv) return;

    try {
      setDownloadingExcessiveBreaksError(undefined);
      setIsDownloadingExcessiveBreaksCsv(true);

      const formattedStartDate = filters.startDate
        ? dayjs(filters.startDate, 'YYYY-MM-DD').format('YYYY-MM-DD')
        : undefined;
      const formattedEndDate = filters.endDate
        ? dayjs(filters.endDate, 'YYYY-MM-DD').format('YYYY-MM-DD')
        : undefined;

      const response = await getExcessiveBreaksCsv(workspaceId, {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId ?? undefined,
        downloadType: 'XLSX',
      });

      downloadFile(
        response,
        `pausas-excedidas-${dayjs().format('DD-MM-YYYY')}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      notifySuccess({
        message: 'Download concluído',
        description: 'Relatório de pausas excedidas baixado com sucesso!',
      });

      setIsDownloadingExcessiveBreaksCsv(false);
      return true;
    } catch (error) {
      notifyError('Erro ao baixar relatório de pausas excedidas');
      setDownloadingExcessiveBreaksError(error as ApiError);
      setIsDownloadingExcessiveBreaksCsv(false);
      return false;
    }
  }, [
    isDownloadingExcessiveBreaksCsv,
    workspaceId,
    filters.startDate,
    filters.endDate,
    filters.teamId,
    filters.userId,
    filters.breakSettingId,
  ]);

  return {
    downloadExcessiveBreaksCsv,
    isDownloadingExcessiveBreaksCsv,
    downloadingExcessiveBreaksError,
  };
};
