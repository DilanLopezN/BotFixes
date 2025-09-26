import { apiInstance, doRequest } from '~/services/api-instance';
import { GetNpsAnalyticsByWorkspaceIdParams, NpsAnalytic } from './interfaces';

export const getNpsAnalyticsByWorkspaceId = async ({
  workspaceId,
  ...apiProps
}: GetNpsAnalyticsByWorkspaceIdParams): Promise<NpsAnalytic[]> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/schedule-analytics/metrics-nps-schedule`, apiProps)
  );
