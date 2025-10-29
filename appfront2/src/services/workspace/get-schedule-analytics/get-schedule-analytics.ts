import { apiInstance, doRequest } from '~/services/api-instance';
import { GetScheduleAnalyticsByWorkspaceIdParams, ScheduleAnalytics } from './interfaces';

export const getScheduleAnalyticsByWorkspaceId = async ({
  workspaceId,
  ...apiProps
}: GetScheduleAnalyticsByWorkspaceIdParams): Promise<ScheduleAnalytics> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/schedule-analytics/metrics`, apiProps));
