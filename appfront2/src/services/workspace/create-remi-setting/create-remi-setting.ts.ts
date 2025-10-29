import { apiInstance, doRequest } from '~/services/api-instance';
import type { RemiConfigCreateData } from './interfaces';

export const createRemiSetting = async (
  workspaceId: string,
  payload: RemiConfigCreateData
): Promise<RemiConfigCreateData> =>
  doRequest(apiInstance.post(`/workspaces/${workspaceId}/smt-re-settings`, payload));
