import { PaginatedModel } from '~/interfaces/paginated-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { HealthIntegration } from './interfaces';

export const getHealthIntegrationsByWorkspaceId = (
  workspaceId: string
): Promise<PaginatedModel<HealthIntegration>> => {
  return doRequest(apiInstance.get(`/workspaces/${workspaceId}/integrations/health`));
};
