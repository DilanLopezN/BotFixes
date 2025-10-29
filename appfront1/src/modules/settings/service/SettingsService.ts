import { PaginatedModel } from '../../../model/PaginatedModel';
import { OffDaysPeriod, Team } from '../../../model/Team';
import { apiInstance, doRequest } from '../../../utils/Http';
import { serialize } from '../../../utils/serializeQuery';
import { TemplateCategory, TemplateMessage } from '../../liveAgent/components/TemplateMessageList/interface';
import { WorkspaceAccessControl } from '../components/GroupAccess/components/GroupsAccessWrapper/interface';
import { RatingSettings } from '../components/Rating/interface';

export const SettingsService = {
    createTeam: async (workspaceId: string, team: Team, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/teams`, team), undefined, errCb);
    },
    getTeam: async (workspaceId: string, teamId: string): Promise<any> => {
        const team: Team = await doRequest(apiInstance.get(`/workspaces/${workspaceId}/teams/${teamId}`));

        const normalizedTeam = {
            ...team,
            name: !team.inactivatedAt ? team.name : `${team.name} - (Inativo)`,
        };

        return normalizedTeam;
    },
    getTeams: async (query: any, workspaceId: string, errCb?): Promise<PaginatedModel<Team>> => {
        let toSerialize = {
            filter: JSON.stringify(query.filter || {}),
            sort: 'name',
        } as any;

        if (query) {
            toSerialize = {
                ...toSerialize,
            };

            if (query.projection) {
                toSerialize.projection = JSON.stringify({ ...query.projection });
            }

            if (query.skip) toSerialize.skip = query.skip;

            if (query.limit) toSerialize.limit = query.limit;

            if (!!query.search) {
                toSerialize = {
                    ...toSerialize,
                    search: query.search,
                };
            }
        }
        const queryString = serialize({
            ...toSerialize,
        });

        const response = await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/teams?${queryString}`),
            undefined,
            errCb
        );

        const normalizedData = response?.data?.map((team: Team) => {
            if (!team.inactivatedAt) return team;

            return { ...team, name: `${team.name} - (Inativo)` };
        });

        return { ...response, data: normalizedData };
    },
    updateTeam: async (workspaceId: string, team: Team, errCb?): Promise<any> => {
        return await doRequest(apiInstance.put(`/workspaces/${workspaceId}/teams/${team._id}`, team), undefined, errCb);
    },
    deleteTeam: async (workspaceId: string, teamId: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/teams/${teamId}`), undefined, errCb);
    },
    createGroupAccess: async (workspaceId: string, groupAccess: WorkspaceAccessControl, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/access-groups`, groupAccess),
            undefined,
            errCb
        );
    },
    updateGroupAccess: async (workspaceId: string, groupAccess: any, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/access-groups/${groupAccess._id}`, groupAccess),
            undefined,
            errCb
        );
    },
    getGroupsAccess: async (
        query: any,
        workspaceId: string,
        errCb?
    ): Promise<PaginatedModel<WorkspaceAccessControl>> => {
        let toSerialize = {
            filter: JSON.stringify(query.filter || {}),
            sort: 'name',
        } as any;

        if (query) {
            toSerialize = {
                ...toSerialize,
            };

            if (query.skip) toSerialize.skip = query.skip;

            if (query.limit) toSerialize.limit = query.limit;

            if (!!query.search) {
                toSerialize = {
                    ...toSerialize,
                    search: query.search,
                };
            }
        }
        const queryString = serialize({
            ...toSerialize,
        });

        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/access-groups?${queryString}`),
            undefined,
            errCb
        );
    },
    getGroupAccess: async (workspaceId: string, groupId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/access-groups/${groupId}`));
    },
    deleteGroupAccess: async (workspaceId: string, groupId: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/access-groups/${groupId}`), errCb);
    },
    createRating: async (workspaceId: string, ratingSettings: RatingSettings, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/rating/workspaces/${workspaceId}/settings`, ratingSettings),
            undefined,
            errCb
        );
    },
    getRatingSettings: async (workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/rating/workspaces/${workspaceId}/settings`));
    },
    updateRatingSettings: async (workspaceId: string, ratingSettings: RatingSettings, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/rating/workspaces/${workspaceId}/settings/${ratingSettings.id}`, ratingSettings),
            undefined,
            errCb
        );
    },
    checkPlanUserLimit: async (workspaceId: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/users/checkUserCount/workspace/${workspaceId}`), undefined, errCb);
    },
    getCustomerPayments: async (workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/payments`));
    },
    createOffDays: async (workspaceId: string, teamIds: string[], offDay: OffDaysPeriod, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/teams/createOffDays`, { teamIds, offDay }),
            undefined,
            errCb
        );
    },
    updateChannelTemplate: async (
        workspaceId: string,
        templateId: string,
        channelConfigId: string,
        category: TemplateCategory,
        errCb?
    ): Promise<TemplateMessage> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/template-message/${templateId}/updateChannel`, {
                channelConfigId: channelConfigId,
                category,
            }),
            undefined,
            errCb
        );
    },
    deleteChannelTemplate: async (
        workspaceId: string,
        templateId: string,
        channelConfigId: string,
        errCb?
    ): Promise<{ ok: boolean }> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/template-message/${templateId}/deleteChannel`, {
                channelConfigId: channelConfigId,
            }),
            undefined,
            errCb
        );
    },
    changeStatus: async (
        workspaceId: string,
        templateId: string,
        channelConfigId?: string,
        errCb?
    ): Promise<TemplateMessage> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/template-message/${templateId}/change-status${
                    channelConfigId ? `?channelConfigId=${channelConfigId}` : ''
                }`
            ),
            undefined,
            errCb
        );
    },
    syncStatus: async (
        workspaceId: string,
        templateId: string,
        channelConfigId?: string,
        errCb?
    ): Promise<TemplateMessage> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/template-message/${templateId}/sync-status${
                    channelConfigId ? `?channelConfigId=${channelConfigId}` : ''
                }`
            ),
            undefined,
            errCb
        );
    },
};
