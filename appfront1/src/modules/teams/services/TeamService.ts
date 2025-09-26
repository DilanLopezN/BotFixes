import { apiInstance, doRequest } from '../../../utils/Http';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { Team } from '../../../model/Team';

export const TeamService = {
    getTeams: async (workspaceId: string): Promise<PaginatedModel<Team>> => {
        const response = await doRequest(apiInstance.get(`/workspaces/${workspaceId}/teams`));

        const normalizedData = response?.data?.map((team: Team) => {
            if (!team.inactivatedAt) return team;

            return { ...team, name: `${team.name} - (Inativo)` };
        });

        return { ...response, data: normalizedData };
    },
};
