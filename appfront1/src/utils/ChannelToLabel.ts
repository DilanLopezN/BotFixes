import { ChannelIdConfig, User } from 'kissbot-core';
import { Workspace } from '../model/Workspace';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from './UserPermission';

export const channelToLabel = (selectedWorkspace?: Workspace, loggedUser?: User) => {
    if (!selectedWorkspace || !loggedUser) return [];

    let channelList = [
        {
            label: 'Agente',
            value: ChannelIdConfig.liveagent,
        },
        {
            label: 'Webchat',
            value: ChannelIdConfig.webchat,
        },
        {
            label: 'Whatsapp Oficial',
            value: ChannelIdConfig.gupshup,
        },
        {
            label: 'Publicidade',
            value: ChannelIdConfig.ads,
        },
    ];

    if (selectedWorkspace?.featureFlag?.enableTelegram) {
        channelList.push({
            label: 'Telegram',
            value: ChannelIdConfig.telegram,
        });
    }

    if (selectedWorkspace?.featureFlag?.enableChannelApi) {
        channelList.push({
            label: 'Api',
            value: ChannelIdConfig.api,
        });
    }

    if (selectedWorkspace?.featureFlag?.campaign) {
        channelList.push({
            label: 'Lista de Transmissão',
            value: ChannelIdConfig.campaign,
        });
    }

    if (isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, selectedWorkspace._id)) {
        channelList.push({
            label: 'Emulador',
            value: ChannelIdConfig.webemulator,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableConfirmation) {
        channelList.push({
            label: 'Confirmação',
            value: ChannelIdConfig.confirmation,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableReminder) {
        channelList.push({
            label: 'Lembrete',
            value: ChannelIdConfig.reminder,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableNps) {
        channelList.push({
            label: 'Link pesquisa de satisfação',
            value: ChannelIdConfig.nps,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableMedicalReport) {
        channelList.push({
            label: 'Laudo médico',
            value: ChannelIdConfig.medical_report,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableIVR) {
        channelList.push({
            label: 'URA',
            value: ChannelIdConfig.api_ivr,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableScheduleNotification) {
        channelList.push({
            label: 'Notificação de agendamento',
            value: ChannelIdConfig.schedule_notification,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableRecoverLostSchedule) {
        channelList.push({
            label: 'Resgate de agendamento perdido',
            value: ChannelIdConfig.recover_lost_schedule,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableNpsScore) {
        channelList.push({
            label: 'NPS',
            value: ChannelIdConfig.nps_score,
        });
    }

     if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableDocumentsRequest) {
        channelList.push({
            label: 'Solicitação de documentos',
            value: ChannelIdConfig.documents_request,
        });
    }

    if (isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableActiveMkt) {
        channelList.push({
            label: 'Marketing ativo',
            value: ChannelIdConfig.active_mkt,
        });
    }

    return channelList;
};
