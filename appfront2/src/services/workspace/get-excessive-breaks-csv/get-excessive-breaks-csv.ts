import { apiInstance, doRequest } from '~/services/api-instance';
import { GetExcessiveBreaksCsvProps } from './interfaces';

export const getExcessiveBreaksCsv = async (
  workspaceId: string,
  params: GetExcessiveBreaksCsvProps
): Promise<Blob> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/agentStatusAnalytics/getBreakOvertimeCsv`,
      {
        startDate: params.startDate,
        endDate: params.endDate,
        teamId: params.teamId,
        userId: params.userId,
        breakSettingId: params.breakSettingId,
        downloadType: params.downloadType || 'XLSX',
      },
      {
        responseType: 'blob',
      }
    )
  );
};
