import type { NewRequestModel } from '~/interfaces/new-request-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetExcessiveBreaksProps, GetExcessiveBreaksResponse } from './interfaces';

export const getExcessiveBreaks = async (
  workspaceId: string,
  payload: NewRequestModel<GetExcessiveBreaksProps>
): Promise<GetExcessiveBreaksResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatusAnalytics/getListBreakOvertime`, payload)
  );
