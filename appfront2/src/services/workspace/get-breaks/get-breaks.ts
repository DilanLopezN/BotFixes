import type { BreakTime } from '~/interfaces/break-time';
import type { NewRequestModel } from '~/interfaces/new-request-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetBreaksProps } from './interfaces';

export const getBreaks = async (
  workspaceId: string,
  payload: GetBreaksProps
): Promise<NewRequestModel<BreakTime[]>> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/agentStatus/breakSettingFindAll`, payload));
