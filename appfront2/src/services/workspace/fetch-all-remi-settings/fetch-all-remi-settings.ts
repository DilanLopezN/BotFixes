import { apiInstance, doRequest } from '~/services/api-instance';
import { RemiConfigData } from '../../../interfaces/remi-config-data';

export const fetchAllRemiSettings = async (workspaceId: string): Promise<RemiConfigData[]> =>
  doRequest(apiInstance.get(`/workspaces/${workspaceId}/smt-re-settings`));
