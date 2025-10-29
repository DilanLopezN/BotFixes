import { ChannelIdConfig } from 'kissbot-core';

export const getDataFromCreatedChannel = (createdByChannel: string) => {
    switch (createdByChannel) {
        case ChannelIdConfig.emulator:
        case ChannelIdConfig.webchat:
        case ChannelIdConfig.webemulator:
            return {
                title: 'Webchat',
                icon: 'speech-bubble',
            };

        case ChannelIdConfig.facebook:
            return {
                title: 'Facebook',
                icon: 'facebook',
            };

        case ChannelIdConfig.gupshup:
        case ChannelIdConfig.wabox:
        case ChannelIdConfig.whatsapp:
        case ChannelIdConfig.whatsweb:
            return {
                title: 'Whatsapp',
                icon: 'whatsapp',
            };

        case ChannelIdConfig.telegram:
            return {
                title: 'Telegram',
                icon: 'telegram',
            };

        case ChannelIdConfig.liveagent:
            return {
                title: 'Agent',
                icon: 'agent',
            };

        case ChannelIdConfig.kissbot:
        case ChannelIdConfig.api:
            return {
                title: 'Bot',
                icon: 'bot',
            };

        case ChannelIdConfig.campaign:
            return {
                title: 'Campaign',
                icon: 'campaign',
            };
        case ChannelIdConfig.confirmation:
            return {
                title: 'Confirmation',
                icon: 'confirmation',
            };
        case ChannelIdConfig.reminder:
            return {
                title: 'Reminder',
                icon: 'reminder',
            };
        case ChannelIdConfig.nps:
            return {
                title: 'Link pesquisa de satisfação',
                icon: 'nps',
            };
        case ChannelIdConfig.nps_score:
            return {
                title: 'NPS',
                icon: 'nps',
            };
        case ChannelIdConfig.medical_report:
            return {
                title: 'Laudo médico',
                icon: 'medical_report',
            };
        case ChannelIdConfig.ads:
            return {
                title: 'Publicidade',
                icon: 'ads',
            };
        case ChannelIdConfig.api_ivr:
            return {
                title: 'URA',
                icon: 'api_ivr',
            };
        case ChannelIdConfig.schedule_notification:
            return {
                title: 'Notificação de agendamento',
                icon: 'schedule_notification',
            };
        case ChannelIdConfig.recover_lost_schedule:
            return {
                title: 'Resgate de agendamento perdido',
                icon: 'recover_lost_schedule',
            };
        case ChannelIdConfig.documents_request:
            return {
                title: 'Solicitação de documentos',
                icon: 'documents_request',
            };
        default:
            return {
                title: 'Agent',
                icon: 'agent',
            };
    }
};
