import { Team } from '~/interfaces/team';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateTeamById = async (workspaceId: string, payload: Team): Promise<Team> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/teams/updateTeam`, { data: payload }));
