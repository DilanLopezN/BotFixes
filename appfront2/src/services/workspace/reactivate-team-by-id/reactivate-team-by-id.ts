import { apiInstance, doRequest } from '~/services/api-instance';
import type { ReactivateTeamProps } from './interfaces';

export const reactivateTeamById = async ({
  workspaceId,
  teamId,
}: ReactivateTeamProps): Promise<any> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/teams/doReactivateTeam`, {
      data: {
        teamId,
      },
    })
  );
