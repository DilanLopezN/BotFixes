import { useCallback, useState } from 'react';
import { ExportType } from '~/components/export-button';
import type { ApiError } from '~/interfaces/api-error';
import { exportAppointmentTable } from '~/services/workspace/export-appointment-table';
import { downloadFile } from '~/utils/download-file';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';

export const useExportAppointmentTable = () => {
  const [isExportingAppointmentTable, setIsExportingAppointmentTable] = useState(false);
  const [exportAppointmentTableError, setExportAppointmentTableError] = useState<ApiError>();
  const filters = useFilters();

  const exportTable = useCallback(
    async (downloadType: ExportType) => {
      if (isExportingAppointmentTable) return;
      try {
        setExportAppointmentTableError(undefined);
        setIsExportingAppointmentTable(true);
        const blob = await exportAppointmentTable({ downloadType, ...filters });

        const isCsv = downloadType === ExportType.Csv;
        const fileName = `appointment-table.${isCsv ? 'csv' : 'xlsx'}`;
        const fileType = isCsv
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        downloadFile(blob, fileName, fileType);
        setIsExportingAppointmentTable(false);
      } catch (error) {
        notifyError('Erro ao exportar a tabela');
        setExportAppointmentTableError(error as ApiError);
        setIsExportingAppointmentTable(false);
      }
    },
    [filters, isExportingAppointmentTable]
  );

  return {
    exportTable,
    isExportingAppointmentTable,
    exportAppointmentTableError,
  };
};
