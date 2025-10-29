import { apiInstance, doRequest } from '~/services/api-instance';
import { GetUserTeamsByIdResponse } from './interfaces';

export const getUserTeamsById = async (
  workspaceId: string,
  userId: string
): Promise<GetUserTeamsByIdResponse> => {
  return doRequest(apiInstance.get(`/workspaces/${workspaceId}/users/${userId}/teams`));
};
