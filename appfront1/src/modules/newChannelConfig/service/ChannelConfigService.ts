import { doRequest, apiInstance } from '../../../utils/Http';
import { ChannelConfig } from '../../../model/Bot';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { serialize } from '../../../utils/serializeQuery';

export const ChannelConfigService = {
    deleteChannelConfig: async (channelConfigId: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete('/channel-configs/' + channelConfigId), errCb);
    },
    createChannelConfig: async (channelConfig: ChannelConfig, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post('/channel-configs', channelConfig), undefined, errCb);
    },
    getChannelConfigList: async (workspaceId: string): Promise<ChannelConfig[]> => {
        const response = await doRequest(apiInstance.get(`/channel-configs?workspaceId=${workspaceId}`));
        return response?.data || [];
    },
    updateChannelConfig: async (channelConfig: ChannelConfig, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.put('/channel-configs/' + channelConfig._id, channelConfig),
            undefined,
            errCb
        );
    },
    updateChannelConfigAvatar: async (channelConfigId, formData, errCb?) => {
        return await doRequest(
            apiInstance.post(`/channel-configs/${channelConfigId}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            errCb
        );
    },
    getChannelsConfig: async (query: any): Promise<ChannelConfig[]> => {
        const queryString = serialize({
            filter: JSON.stringify({
                ...query,
            }),
        });

        return (
            ((await doRequest(apiInstance.get(`/channel-configs?${queryString}`))) as PaginatedModel<ChannelConfig>)
                ?.data || []
        );
    },
    getChannelConfig: async (channelId: string): Promise<ChannelConfig[]> => {
        return (
            ((await doRequest(apiInstance.get(`/channel-configs?_id=${channelId}`))) as PaginatedModel<ChannelConfig>)
                ?.data || []
        );
    },
    createDefaultTemplates: async (
        workspaceId: string,
        channelConfigId: string,
        clientName: string
    ): Promise<{ ok: boolean }> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/template-message/create-default-templates`, {
                clientName,
                channelConfigId,
            }),
            undefined,
            undefined
        );
    },
};
