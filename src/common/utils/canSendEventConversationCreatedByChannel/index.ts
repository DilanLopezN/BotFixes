import { Conversation } from 'kissbot-entities';
import { ChannelIdConfig } from 'kissbot-core';

export enum OmitEventByChannels {
    confirmation = ChannelIdConfig.confirmation,
    reminder = ChannelIdConfig.reminder,
    nps = ChannelIdConfig.nps,
    medical_report = ChannelIdConfig.medical_report,
    api = ChannelIdConfig.api,
    api_ivr = ChannelIdConfig.api_ivr,
    schedule_notification = ChannelIdConfig.schedule_notification,
    recover_lost_schedule = ChannelIdConfig.recover_lost_schedule,
    nps_score = ChannelIdConfig.nps_score,
    documents_request = ChannelIdConfig.documents_request,
    active_mkt = ChannelIdConfig.active_mkt,
}

// Não enviar evento socket para canais de envio automatico EX: (confirmation, reminder, npm, medical_report)
// Caso esteja assinado para algum time não deve omitir os eventos
export const canSendEventConversationCreatedByChannel = (conversation: Conversation) => {
    if (!!conversation?.assignedToTeamId) {
        return true;
    }
    return !Object.keys(OmitEventByChannels).includes(conversation?.createdByChannel);
};
