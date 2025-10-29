import { Team } from '~/interfaces/team';
import { apiInstance, doRequest } from '~/services/api-instance';

export const createTeam = async (workspaceId: string, payload: Team): Promise<Team> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/teams/createTeam`, { data: payload }));
