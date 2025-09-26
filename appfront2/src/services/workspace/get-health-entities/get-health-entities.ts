import type { PaginatedModel } from '~/interfaces/paginated-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetHealthEntitiesProps, HealthEntity } from './interfaces';

export const getHealthEntities = ({
  workspaceId,
  integrationId,
  queryString,
}: GetHealthEntitiesProps): Promise<PaginatedModel<HealthEntity>> => {
  return doRequest(
    apiInstance.get(
      `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities${queryString}`
    )
  );
};
