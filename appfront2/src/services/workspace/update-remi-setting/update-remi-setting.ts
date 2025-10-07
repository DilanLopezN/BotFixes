import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateRemiSetting = async (
  workspaceId: string,
  settingId: string,
  payload: Partial<RemiConfigData>
): Promise<RemiConfigData> =>
  doRequest(apiInstance.put(`/workspaces/${workspaceId}/smt-re-settings/${settingId}`, payload));
