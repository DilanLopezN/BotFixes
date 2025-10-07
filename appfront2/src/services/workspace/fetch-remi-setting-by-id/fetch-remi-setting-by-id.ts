import type { RemiConfigData } from '~/interfaces/remi-config-data';
import { apiInstance, doRequest } from '~/services/api-instance';

export const fetchRemiSettingById = async (
  workspaceId: string,
  settingId: string
): Promise<RemiConfigData> =>
  doRequest(apiInstance.get(`/workspaces/${workspaceId}/smt-re-settings/${settingId}`));
