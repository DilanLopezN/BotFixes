import { apiInstance, doRequest } from '~/services/api-instance';
import type { ChangeAgentStatusProps } from './interfaces';

export const changeAgentStatus = async (workspaceId: string, payload: ChangeAgentStatusProps) =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatus/workingTimeBulkChangeBreak`, payload)
  );
