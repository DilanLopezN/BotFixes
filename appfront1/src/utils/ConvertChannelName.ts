import { ChannelIdConfig } from 'kissbot-core';

export const convertChannelName = (name: string) => {
    switch (name) {
        case ChannelIdConfig.liveagent:
            return 'Agente';

        case ChannelIdConfig.webemulator:
            return 'Emulador';

        case ChannelIdConfig.webchat:
            return 'Webchat';

        case ChannelIdConfig.gupshup:
            return 'Whatsapp Oficial';

        case ChannelIdConfig.kissbot:
            return 'Bot';

        case ChannelIdConfig.telegram:
            return 'Telegram';

        case ChannelIdConfig.facebook:
            return 'Facebook';

        case ChannelIdConfig.instagram:
            return 'Instagram';

        case ChannelIdConfig.whatsweb:
            return 'Whatsapp Não Oficial';

        case ChannelIdConfig.medical_report:
            return 'Laudo Médico';

        case ChannelIdConfig.reminder:
            return 'Lembrete';

        case ChannelIdConfig.nps:
            return 'Link pesquisa de satisfação';

        case ChannelIdConfig.confirmation:
            return 'Confirmação';

        case ChannelIdConfig.campaign:
            return 'Lista de Transmissão';

        case ChannelIdConfig.api:
            return 'Api';

        case ChannelIdConfig.ads:
            return 'Publicidade';

        case ChannelIdConfig.api_ivr:
            return 'URA';

        case ChannelIdConfig.schedule_notification:
            return 'Notificação de agendamento';

        case ChannelIdConfig.recover_lost_schedule:
            return 'Resgate de agendamento perdido';

        case ChannelIdConfig.nps_score:
            return 'NPS';
        
        case ChannelIdConfig.documents_request:
            return 'Solicitação de documentos';

        case ChannelIdConfig.active_mkt:
            return 'Marketing ativo';

        default:
            return name;
    }
};
