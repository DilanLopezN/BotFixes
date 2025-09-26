import { apiInstance, doRequest } from '~/services/api-instance';
import type { InactivateTeamProps } from './interfaces';

export const inactivateTeamById = async ({
  workspaceId,
  teamId,
}: InactivateTeamProps): Promise<any> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/teams/doInactiveTeam`, {
      data: {
        teamId,
      },
    })
  );
