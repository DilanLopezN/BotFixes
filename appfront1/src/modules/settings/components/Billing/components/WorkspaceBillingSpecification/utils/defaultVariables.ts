import moment from 'moment';
import { WorkspaceChannels } from '../interface';

export const emptyWorkspaceBilling = (workspaceId: string, name: string) => ({
    id: workspaceId,
    name: name,
    plan: '',
    invoiceDescription: 'Nota referente aos serviços prestados no mês: {{MES}}. Quantidade de atendimento: {{QTD_ATENDIMENTOS}}.',
    paymentDescription: 'Cobrança referente aos serviços prestados no mês: {{MES}}.',
    dueDate: 1,
    planPrice: 0,
    planMessageLimit: 0,
    planExceededMessagePrice: 0,
    planHsmMessageLimit: 0,
    planHsmExceedMessagePrice: 0,
    planUserLimit: 0,
    planUserExceedPrice: 0,
    startAt: moment().valueOf(),
    accountId: 0,
    planConversationExceedPrice: 0,
    planConversationLimit: 0,
});

export const defaultChannelSpecification = (workspaceId?: string) => {
    return Object.keys(WorkspaceChannels).map(channel => {
        return {
            workspaceId: workspaceId || '',
            channelId: WorkspaceChannels[channel],
            conversationLimit: 0,
            conversationExcededPrice: 0,
            messageLimit: 0,
            messageExcededPrice: 0,
        }
    })
};

export enum ConvertChannelName {
    api = 'Api',
    campaign = 'Campanha',
    'whatsapp-gupshup' = 'Whatsapp',
    'live-agent' = 'Agente',
    webchat = 'Webchat',
}
