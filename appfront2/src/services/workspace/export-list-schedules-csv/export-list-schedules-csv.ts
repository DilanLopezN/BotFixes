import { apiInstance, doRequest } from '~/services/api-instance';
import { ExportListSchedulesCsvParams } from './interfaces';
import { TypeDownloadEnum } from './type-download-enum';

export const exportListSchedulesCsv = async ({
  workspaceId,
  filter,
  downloadType,
}: ExportListSchedulesCsvParams): Promise<void> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/schedule-analytics/schedules/export-csv`,
      {
        ...filter,
        downloadType,
      },
      {
        responseType: 'blob',
      }
    )
  ).then((response) => {
    const extension = downloadType === TypeDownloadEnum.CSV ? 'csv' : 'xlsx';
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-atendimentos.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
