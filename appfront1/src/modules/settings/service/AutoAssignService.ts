import { doRequest, apiInstance } from '../../../utils/Http';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { serialize } from '../../../utils/serializeQuery';
import {
    AutoAssignConversation,
    ContactAutoAssign,
    CreateAutoAssignConversation,
    UpdateAutoAssignConversation,
} from '../interfaces/auto-assign-conversation.interface';
export const AutoAssignService = {
    createAutoAssign: async (workspaceId: string, data: CreateAutoAssignConversation, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/auto-assign-conversation`, data),
            undefined,
            errCb
        );
    },

    getAutoAssignConversation: async (workspaceId: string, autoAssignConversationId: number): Promise<any> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/auto-assign-conversations/${autoAssignConversationId}`)
        );
    },
    getAutoAssignConversations: async (
        query: any,
        workspaceId: string,
        errCb?
    ): Promise<PaginatedModel<AutoAssignConversation>> => {
        let toSerialize = {
            filter: JSON.stringify(query.filter || {}),
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
            apiInstance.get(`/workspaces/${workspaceId}/auto-assign-conversations?${queryString}`),
            undefined,
            errCb
        );
    },
    updateAutoAssignConversation: async (
        workspaceId: string,
        data: UpdateAutoAssignConversation,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/auto-assign-conversations/${data.id}`, data),
            undefined,
            errCb
        );
    },
    deleteAutoAssign: async (workspaceId: string, autoAssignConversationId: number, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`/workspaces/${workspaceId}/auto-assign-conversations/${autoAssignConversationId}`),
            errCb
        );
    },

    getContactAutoAssignByPhone: async (
        workspaceId: string,
        phone: string,
        errCb?
    ): Promise<ContactAutoAssign | undefined> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/contact-auto-assigns/phone`, { phone }),
            undefined,
            errCb
        );
    },
};
