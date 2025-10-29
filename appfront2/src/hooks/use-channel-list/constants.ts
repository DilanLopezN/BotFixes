import { ChannelIdConfig } from '~/constants/channel-id-config';
import type { Me } from '~/interfaces/me';
import type { Workspace } from '~/interfaces/workspace';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';

export const getChannelAttributesMap = (selectedWorkspace: Workspace, loggedUser: Me) => {
  return {
    [ChannelIdConfig.webchat]: { label: 'Webchat', hasPermission: true },
    [ChannelIdConfig.webemulator]: {
      label: 'Emulador',
      hasPermission:
        isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, selectedWorkspace._id),
    },
    [ChannelIdConfig.emulator]: { label: 'Emulador', hasPermission: true },
    [ChannelIdConfig.wabox]: { label: 'wabox', hasPermission: true },
    [ChannelIdConfig.whatsapp]: { label: 'whatsapp', hasPermission: true },
    [ChannelIdConfig.sms]: { label: 'sms', hasPermission: true },
    [ChannelIdConfig.gupshup]: { label: 'Whatsapp oficial', hasPermission: true },
    [ChannelIdConfig.d360]: { label: 'whatsapp-d360', hasPermission: true },
    [ChannelIdConfig.whatsweb]: { label: 'whatsweb', hasPermission: true },
    [ChannelIdConfig.liveagent]: { label: 'Agente', hasPermission: true },
    [ChannelIdConfig.kissbot]: { label: 'kissbot', hasPermission: true },
    [ChannelIdConfig.telegram]: {
      label: 'Telegram',
      hasPermission: selectedWorkspace?.featureFlag?.enableTelegram,
    },
    [ChannelIdConfig.rating]: { label: 'rating', hasPermission: true },
    [ChannelIdConfig.facebook]: { label: 'facebook', hasPermission: true },
    [ChannelIdConfig.instagram]: { label: 'instagram', hasPermission: true },
    [ChannelIdConfig.api]: {
      label: 'Api',
      hasPermission: selectedWorkspace?.featureFlag?.enableChannelApi,
    },
    [ChannelIdConfig.campaign]: {
      label: 'Lista de Transmissão',
      hasPermission: selectedWorkspace?.featureFlag?.campaign,
    },
    [ChannelIdConfig.confirmation]: {
      label: 'Confirmação',
      hasPermission:
        isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableConfirmation,
    },
    [ChannelIdConfig.reminder]: {
      label: 'Lembrete',
      hasPermission: isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableReminder,
    },
    [ChannelIdConfig.nps]: {
      label: 'Link pesquisa de satisfação',
      hasPermission: isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableNps,
    },
    [ChannelIdConfig.medical_report]: {
      label: 'Laudo médico',
      hasPermission:
        isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableMedicalReport,
    },
    [ChannelIdConfig.ads]: { label: 'Publicidade', hasPermission: true },
    [ChannelIdConfig.api_ivr]: {
      label: 'URA',
      hasPermission: isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableIVR,
    },
    [ChannelIdConfig.schedule_notification]: {
      label: 'Notificação de agendamento',
      hasPermission:
        isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableScheduleNotification,
    },
    [ChannelIdConfig.recover_lost_schedule]: {
      label: 'Resgate de agendamento perdido',
      hasPermission:
        isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableRecoverLostSchedule,
    },
    [ChannelIdConfig.nps_score]: {
      label: 'NPS',
      hasPermission: isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableNpsScore,
    },
    [ChannelIdConfig.documents_request]: {
      label: 'Solicitação de documentos',
      hasPermission:
        isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableDocumentsRequest,
    },
    [ChannelIdConfig.active_mkt]: {
      label: 'Marketing ativo',
      hasPermission: isSystemAdmin(loggedUser) || selectedWorkspace?.featureFlag?.enableActiveMkt,
    },
  };
};
