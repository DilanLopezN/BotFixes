import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetGeneralProductivityProps, GetGeneralProductivityResponse } from './interfaces';

export const getGeneralProductivity = async (
  workspaceId: string,
  payload: GetGeneralProductivityProps
): Promise<GetGeneralProductivityResponse> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/analytics/agent-conversation-metrics/total`,
      payload
    )
  );
