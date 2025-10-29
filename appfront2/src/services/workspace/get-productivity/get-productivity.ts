import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetProductivityProps, GetProductivityResponse } from './interfaces';

export const getProductivity = async (
  workspaceId: string,
  payload: GetProductivityProps
): Promise<GetProductivityResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/analytics/team-conversation-metrics`, payload)
  );
