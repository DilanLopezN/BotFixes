import { ExportType } from '~/components/export-button';
import { apiInstance, doRequest } from '~/services/api-instance';
import { ExportListSchedulesCsvParams } from './interfaces';

export const exportListSchedulesCsv = async ({
  workspaceId,
  filter,
  downloadType,
  selectedColumns,
}: ExportListSchedulesCsvParams): Promise<void> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/schedule-analytics/schedules/export-csv`,
      {
        ...filter,
        downloadType,
        selectedColumns,
      },
      {
        responseType: 'blob',
      }
    )
  ).then((response) => {
    const extension = downloadType === ExportType.Csv ? 'csv' : 'xlsx';
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-atendimentos.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
