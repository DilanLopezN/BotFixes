import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { SimplifiedTeam } from '~/interfaces/simplified-team';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getTeamsByWorkspaceId = async (
  workspaceId: string,
  queryString?: string,
  usersLimit?: number
): Promise<PaginatedModel<SimplifiedTeam>> => {
  return doRequest(
    apiInstance.post(`/workspaces/${workspaceId}/teams/listTeamsSimplified${queryString || ''}`, {
      usersLimit,
    })
  );
};
