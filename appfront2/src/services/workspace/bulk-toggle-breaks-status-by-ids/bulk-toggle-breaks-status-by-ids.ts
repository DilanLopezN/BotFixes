import { apiInstance, doRequest } from '~/services/api-instance';
import type {
  BulkToggleBreaksStatusByIdsProps,
  BulkToggleBreaksStatusByIdsResponse,
} from './interfaces';

export const bulkToggleBreaksStatusByIds = async (
  workspaceId: string,
  payload: BulkToggleBreaksStatusByIdsProps
): Promise<BulkToggleBreaksStatusByIdsResponse> => {
  return doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatus/breakSettingBulkEnableDisable`, payload)
  );
};
