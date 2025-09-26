import type { ApiResponse } from '~/interfaces/api-response';
import type { Team } from '~/interfaces/team';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getTeamById = async (
  workspaceId: string,
  teamId: string
): Promise<ApiResponse<Team>> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/teams/getTeam`, { data: { teamId } }));
