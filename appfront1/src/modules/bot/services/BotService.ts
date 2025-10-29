import { User } from 'kissbot-core';
import { ApiErrorCallback } from '../../../interfaces/api-error.interface';
import { Bot, ChannelConfig } from '../../../model/Bot';
import { BotAttribute } from '../../../model/BotAttribute';
import { Interaction } from '../../../model/Interaction';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { apiInstance, doRequest } from '../../../utils/Http';
import { IntentsInterface } from '../Interfaces/Intent.Interface';
import { ActionAtribute, CopyInteractionInterface } from '../Interfaces/InterfacesInteraction';
import { CloneBot } from '../Interfaces/clone-bot.interface';

export const BotService = {
    getBot: async (workspaceId: string, botId: string): Promise<Bot> => {
        return await doRequest(apiInstance.get('/workspaces/' + workspaceId + '/bots/' + botId), true);
    },
    getInteractions: async (workspaceId: string, botId: string): Promise<PaginatedModel<Interaction>> => {
        return await doRequest(apiInstance.get('/workspaces/' + workspaceId + '/bots/' + botId + '/interactions'));
    },
    getInteraction: async (
        workspaceId: string,
        botId: string,
        interactionId: string,
        errCb?: any
    ): Promise<Interaction> => {
        return await doRequest(
            apiInstance.get('/workspaces/' + workspaceId + '/bots/' + botId + '/interactions/' + interactionId),
            errCb
        );
    },
    updateInteraction: async (
        workspaceId: string,
        botId: string,
        interaction: Interaction,
        errCb?: ApiErrorCallback
    ): Promise<Interaction> => {
        return await doRequest(
            apiInstance.put(
                '/workspaces/' + workspaceId + '/bots/' + botId + '/interactions/' + interaction._id,
                interaction
            ),
            undefined,
            errCb
        );
    },
    createInteraction: async (workspaceId: string, botId: string, interaction: Interaction): Promise<Interaction> => {
        return await doRequest(
            apiInstance.post('/workspaces/' + workspaceId + '/bots/' + botId + '/interactions', interaction)
        );
    },
    deleteInteraction: async (workspaceId: string, botId: string, interactionId: string, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.delete('/workspaces/' + workspaceId + '/bots/' + botId + '/interactions/' + interactionId),
            errCb
        );
    },
    getBotAttributes: async (workspaceId: string, botId: string): Promise<PaginatedModel<BotAttribute>> => {
        return await doRequest(apiInstance.get('/workspaces/' + workspaceId + '/bots/' + botId + '/attributes'));
    },
    createBotAttribute: async (
        workspaceId: string,
        botId: string,
        botAttr: BotAttribute
    ): Promise<PaginatedModel<BotAttribute>> => {
        return await doRequest(
            apiInstance.post('/workspaces/' + workspaceId + '/bots/' + botId + '/attributes', botAttr)
        );
    },
    deleteBot: async (workspaceId: string, botId: string, errCb?: any): Promise<any> => {
        return await doRequest(apiInstance.delete('/workspaces/' + workspaceId + '/bots/' + botId), true, errCb);
    },
    getChannelConfigList: async (botId: string): Promise<ChannelConfig[]> => {
        return ((await doRequest(apiInstance.get('/channel-configs?botId=' + botId))) as PaginatedModel<ChannelConfig>)
            ?.data;
    },
    queryBotChannelConfig: async (query?: any): Promise<ChannelConfig[]> => {
        if (query) query = new URLSearchParams(query).toString();
        return ((await doRequest(apiInstance.get(`/channel-configs?${query}`))) as PaginatedModel<ChannelConfig>)?.data;
    },
    deleteBotAttribute: async (workspaceId: string, botId: string, botAttributeId: string, errCb): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`/workspaces/${workspaceId}/bots/${botId}/attributes/${botAttributeId}`),
            true,
            errCb
        );
    },
    updateBotAttribute: async (
        workspaceId: string,
        botId: string,
        botAttributeId: string,
        botAttribute: BotAttribute,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/bots/${botId}/attributes/${botAttributeId}`, botAttribute),
            true,
            errCb
        );
    },
    publishInteractions: async (workspaceId: string, botId: string, errCb): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/bots/${botId}/interactions/publish`, {}),
            false,
            errCb
        );
    },
    publishInteraction: async (
        workspaceId: string,
        botId: string,
        interactionId: string,
        errCb: ApiErrorCallback
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/bots/${botId}/interactions/${interactionId}/publish`, {}),
            false,
            errCb
        );
    },
    getInteractionsErrors: async (workspaceId: string, botId: string, errCb): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/bots/${botId}/interactions/errors`, {}),
            false,
            errCb
        );
    },
    getInteractionsPendingPublication: async (workspaceId: string, botId: string, errCb): Promise<any> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/bots/${botId}/interactions/pending`, {}),
            false,
            errCb
        );
    },
    revertChanges: async (workspaceId: string, botId: string, errCb): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/bots/${botId}/interactions/revert`, {}),
            false,
            errCb
        );
    },
    updateBot: async (workspaceId: string, bot: Bot, errCb?): Promise<Bot> => {
        return await doRequest(apiInstance.put(`/workspaces/${workspaceId}/bots/${bot._id}`, bot), false, errCb);
    },
    copyInteraction: async (
        workspaceId: string,
        botId: string,
        fromInteractionId,
        data: CopyInteractionInterface
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/bots/${botId}/interactions/${fromInteractionId}/copy`, data)
        );
    },
    campaignAction: async (workspaceId: string, actionAttr: ActionAtribute, errCb?: ApiErrorCallback): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign-actions`, actionAttr),
            false,
            errCb
        );
    },
    pendingPublicationsOnIntegrations: async (workspaceId: string, user: User): Promise<any> => {
        return await doRequest(
            apiInstance.get('/workspaces/' + workspaceId + '/integrations/general/pending-publication'),
            true
        );
    },
    getIntentsByWorkspaceIdAndBotId: async (workspaceId: string, botId: string): Promise<IntentsInterface[]> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/bot/${botId}/intents`), true);
    },
    cloneBot: async (workspaceId: string, data: CloneBot): Promise<any> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/bots/clone-bot`, data));
    },
};
