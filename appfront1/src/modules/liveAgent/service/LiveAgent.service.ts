import { ActivityType, ConversationTabFilter, IdentityType, User } from 'kissbot-core';
import omit from 'lodash/omit';
import orderBy from 'lodash/orderBy';
import moment from 'moment';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { apiInstance, doRequest } from '../../../utils/Http';
import { serialize } from '../../../utils/serializeQuery';
import { Tag } from '../components/TagSelector/props';
import { Activity } from '../interfaces/activity.interface';
import { ConversationSearchResult } from '../interfaces/conversation.interface';

export interface ConversationSearchQueryParams {
    limit: number;
    skip: number;
    term: string;
    sort?: string;
}

interface ConversationSearchFilters {
    state?: string;
    tags?: string[];
    teams?: string[];
    startDate?: number;
    endDate?: number;
    channels?: string[];
}

export const parseConversationFilters = (filter: any) => {
    if (filter.formValues) {
        delete filter.formValues;
    }

    const formatDate = (currDate: string, period?: string) => {
        if (!period) {
            return moment(currDate).utc().toISOString();
        }

        if (period === 'end') {
            return moment(currDate).endOf('day').utc().toISOString();
        }

        return moment(currDate).utc().toISOString();
    };

    const transformToQueryFilter = (filters: any) => {
        filters.filter = {};

        if (filters.tags) {
            if (!filters.filter.$and) filters.filter = { $and: [] };

            filters.filter.$and.push(
                ...filter.tags.map((tag: string) => {
                    return { 'tags.name': tag };
                })
            );

            delete filters.tags;
        }

        if (filters.teams) {
            if (!filters.filter.$and) {
                filters.filter = { $and: [] };
            }

            filters.filter.$and = [{ $or: [] }, ...filters.filter.$and];

            filters.filter.$and[0].$or.push(
                ...filter.teams.map((teamId: string) => {
                    return { assignedToTeamId: teamId };
                })
            );

            delete filters.teams;
        }

        if (filters['assumedBy']) {
            if (filters['assumedBy'] === -1) {
                if (!filters.filter.$and) filters.filter = { $and: [] };

                filters.filter.$and.push(
                    { state: { $ne: 'closed' } },
                    { 'members.type': { $ne: IdentityType.agent } },
                    {
                        $and: [{ 'members.type': { $eq: IdentityType.bot } }, { 'members.disabled': { $eq: true } }],
                    },
                    {
                        $and: [{ 'members.type': { $eq: IdentityType.channel } }],
                    }
                );
            } else {
                filters['members.id'] = filters['assumedBy'];
            }

            delete filters.assumedBy;
        }

        if (filters.rangeDate) {
            if (!filters.filter.$and) {
                filters.filter = { $and: [] };
            }

            if (filters.rangeDate[0] == filters.rangeDate[1]) {
                filters.filter.$and.push({
                    createdAt: {
                        $gte: formatDate(filters.rangeDate[0]),
                        $lte: formatDate(filters.rangeDate[0], 'end'),
                    },
                });
            } else {
                filters.filter.$and.push({
                    createdAt: {
                        $gte: formatDate(filters.rangeDate[0]),
                        $lte: formatDate(filters.rangeDate[1]),
                    },
                });
            }

            delete filters.rangeDate;
        }

        if (filter.suspended) {
            if (!filters.filter.$and) {
                filters.filter = { $and: [] };
            }

            filters.filter.$and.push({
                suspendedUntil: { $gte: moment().valueOf() },
            });
        } else if (
            filter?.tab === ConversationTabFilter.awaitAgent ||
            filter?.tab === ConversationTabFilter.inbox ||
            filter?.tab === ConversationTabFilter.teams
        ) {
            if (!filters.filter.$and) filters.filter = { $and: [] };
            filters.filter.$and.push({
                suspendedUntil: { $lte: moment().valueOf() },
            });
        }

        delete filter.suspended;

        if (!!filters.channels) {
            filters['createdByChannel'] = filters.channels.join(',');
            delete filters.channels;
        } else {
            filters['createdByChannel'] = `!=webemulator`;
        }

        if (!!filters.token) {
            if (!filters.filter.$and) {
                filters.filter = { $and: [] };
            }

            filters.filter.$and = [{ $or: [] }, ...filters.filter.$and];

            filters.filter.$and[0].$or.push(
                ...filter.token.map((value: string) => {
                    return { token: value };
                })
            );

            delete filters.token;
        }

        if (filters.search === undefined) {
            delete filters.search;
        }

        return filters;
    };

    filter = transformToQueryFilter(filter);
    filter.filter = JSON.stringify(filter.filter);
    return filter;
};

export const LiveAgentService = {
    transformConversations: (conversations: any[], loggedUser: User): { [key: string]: any } => {
        if (conversations?.length === 0) {
            return {};
        }

        return conversations?.reduce((memo, conversation) => {
            let assumed = false;

            const user = [...(conversation?.members || [])]?.filter((member) => {
                if (!assumed) if (member.id === loggedUser._id && !member.disabled) assumed = true;

                return member.type === IdentityType.user;
            })[0];

            memo[conversation?._id] = {
                ...conversation,
                lastActivity: [...orderBy(conversation?.activities, 'timestamp', 'asc')]
                    .filter(
                        (activity) =>
                            activity.type === ActivityType.message ||
                            activity.type === ActivityType.member_upload_attachment ||
                            (activity.type === ActivityType.event && activity.name === 'start')
                    )
                    .pop(),
                user,
                assumed,
            };

            return memo;
        }, {});
    },
    getConversations: async (
        workspaceId: string,
        page: number,
        limit: number,
        filter,
        loggedUser,
        showMessageError: boolean = true
    ): Promise<PaginatedModel<any> & { query: any }> => {
        // Deleto os valores e sobrescrevo pelos valores de formValues #1661
        // @TODO: deixar de setar os campos na raiz do objeto e utilizar apenas o .formValues

        if (!filter) {
            filter = {};
        }

        delete filter.teams;
        delete filter.state;
        delete filter.assumedBy;
        delete filter.channels;
        delete filter.suspended;
        delete filter.rangeDate;
        delete filter.tags;
        delete filter.token;

        filter = { ...filter, ...(filter?.formValues ?? {}) };
        filter = parseConversationFilters(filter);

        const createSortString = () => {
            let customSort: string = '';

            if (!filter.sort || !filter.sort.field) {
                return '';
            }

            const sortType = (dir: string) => (dir === 'desc' ? '-' : '');

            filter.sort.field.forEach((field: string, i: number) => {
                const order = sortType(filter.sort.direction[i] || filter.sort.direction[0]);
                customSort += `${order}${field}`;

                if (i + 1 < filter.sort.field.length) {
                    customSort += `,`;
                }
            });
            return `${customSort}`;
        };

        const sort = createSortString();

        const queryString = serialize({
            ...filter,
            skip: page * limit,
            limit,
            sort,
        });

        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/conversations?${queryString}`),
            showMessageError
        );
    },
    viewConversation: async (
        workspaceId: string,
        conversationId: string,
        memberId: string,
        viewed?: boolean
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversations/${conversationId}/members/${memberId}/view`, {
                viewed: !!viewed,
            })
        );
    },
    assumeConversation: async (
        workspaceId: string,
        conversationId: string,
        userId: string,
        body: any,
        errorCallback: (error: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversations/${conversationId}/assume/${userId}`, body),
            false,
            errorCallback
        );
    },
    sendNewActivity: async (
        workspaceId: string,//vai o quoked
        conversationId: string,
        activity,
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversations/${conversationId}/activities`, { ...activity }),
            false,
            errCb
        );
    },
    sendNewActivityReaction: async (
        workspaceId: string,
        conversationId: string,
        activity: Partial<Activity>,
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversations/${conversationId}/activities/reaction`, {
                ...activity,
            }),
            false,
            errCb
        );
    },
    startConversation: async (
        conversationAgent: any,
        workspaceId: string,
        channelConfigId: string,
        errCb: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`workspaces/${workspaceId}/channel-configs/${channelConfigId}/conversation`, {
                ...conversationAgent,
            }),
            false,
            errCb
        );
    },
    leaveConversation: async (workspaceId: string, conversationId: string, memberId: string): Promise<any> => {
        return await doRequest(
            apiInstance.put(
                `/workspaces/${workspaceId}/conversations/${conversationId}/members/${memberId}/unsubscribe`,
                {}
            )
        );
    },
    adminRemoveMemberFromConversation: async (
        workspaceId: string,
        conversationId: string,
        memberId: string,
        errCb: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(
                `/workspaces/${workspaceId}/conversations/${conversationId}/members/${memberId}/unsubscribeByAdmin`,
                {}
            ),
            false,
            errCb
        );
    },
    changeStateConversation: async (
        workspaceId: string,
        memberId: string,
        conversationId: string,
        state
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/conversations/${conversationId}/members/${memberId}/close`, {
                ...state,
            })
        );
    },
    suspendConversation: async (
        workspaceId: string,
        memberId: string,
        conversationId: string,
        until: number
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/conversations/${conversationId}/members/${memberId}/suspend`, {
                until,
            })
        );
    },
    checkPhoneStatus: async (phoneNumber: string, ddi: string, workspaceId: string, contactId?: string, errCb?: (err: any) => any): Promise<any> => {
        return await doRequest(
            apiInstance.post(`workspaces/${workspaceId}/check-phone-number`, { phone: phoneNumber, ddi: ddi, contactId }),
            false,
            errCb
        );
    },
    getConversationList: async (query: any, workspaceId: string): Promise<PaginatedModel<any>> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/conversations?${query}`));
    },
    getHistoryConversation: async (
        contactId: string,
        workspaceId: string,
        skip: number
    ): Promise<PaginatedModel<any>> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/conversation-history/${contactId}?skip=${skip || 0}`)
        );
    },
    getConversation: async (conversationId: string, workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/conversations?_id=${conversationId}`));
    },
    createTag: async (workspaceId: string, conversationId: string, tag: Tag): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversations/${conversationId}/tags`, { ...tag })
        );
    },
    removeTag: async (workspaceId: string, conversationId: string, tag: Tag): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`/workspaces/${workspaceId}/conversations/${conversationId}/tags/${tag._id}`)
        );
    },
    getUniqueConversation: async (
        conversationId: string,
        workspaceId: string,
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/conversations/${conversationId}`),
            false,
            errCb
        );
    },
    searchActivities: async (workspaceId: string, queryParams: any): Promise<any[]> => {
        const queryString = new URLSearchParams({ ...queryParams }).toString();

        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/activities/search?${queryString}`));
    },
    getTabQueries: async (workspaceId: string, errCb?: (err: any) => any): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/conversations/queries`), false, errCb);
    },
    getTabCount: async (
        tabType: ConversationTabFilter,
        workspaceId: string,
        filter: any,
        errCb?: (err: any) => any
    ): Promise<any> => {
        filter = parseConversationFilters(filter);
        filter = omit(filter, ['tab', 'sort']);

        const queryString = serialize({
            ...filter,
        });

        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/conversations/tab/${tabType}/?${queryString}`),
            false,
            errCb
        );
    },
    transfer: async (
        workspaceId: string,
        teamId: string,
        loggedUserId: string,
        conversationId: string,
        body: any,
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversations/${conversationId}/members/${loggedUserId}/transfer/${teamId}`,
                body
            ),
            false,
            errCb
        );
    },
    transferConversationToAgent: async (
        workspaceId: string,
        conversationId: string,
        body: {teamId: string, agentId: string},
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversations/${conversationId}/transfer-to-agent`,
                body
            ),
            false,
            errCb
        );
    },
    searchConversationList: async (
        workspaceId: string,
        queryParams: ConversationSearchQueryParams,
        filters: any
    ): Promise<PaginatedModel<ConversationSearchResult>> => {
        const newFilters: ConversationSearchFilters = {};

        if (filters.channels) {
            newFilters.channels = filters.channels;
        }

        if (filters.state) {
            newFilters.state = filters.state;
        }

        if (filters.tags) {
            newFilters.tags = filters.tags;
        }

        if (filters.teams) {
            newFilters.teams = filters.teams;
        }

        if (filters.rangeDate) {
            newFilters.startDate = moment(filters.rangeDate[0]).startOf('day').valueOf();
            newFilters.endDate = moment(filters.rangeDate[1]).endOf('day').valueOf();
        }

        const queryString = new URLSearchParams({ ...queryParams } as any).toString();
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversations/search?${queryString}`, newFilters)
        );
    },
    activityAudioTranscription: async (
        workspaceId: string,
        activityId: string,
        errCb?: (err: any) => any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/activities/audio-transcription`,
                { activityId },
                { timeout: 30000 }
            ),
            false,
            errCb
        );
    },
};
