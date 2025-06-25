import { Document, Types } from 'mongoose';

interface TeamPermission {
    // Pode iniciar conversa de forma ativa
    canStartConversation: boolean;

    // Ver conversas finalizadas por outros agentes
    canViewFinishedConversations: boolean;

    // Pode ver conversas assinadas/assumidas para outros membros do time
    canViewOpenTeamConversations: boolean;

    // Pode ver a conversa na lista, mas não as activities antes de assumir
    canViewConversationContent: boolean;

    // Tem permissão para transferir para qualquer time do workspace
    canTransferConversations: boolean;
    canSendAudioMessage: boolean;

    // Tem permissão para enviar template oficial
    canSendOfficialTemplate?: boolean;

    // Tem permissão para visualizar todos os atendimentos finalizados do time
    canViewHistoricConversation?: boolean;

    // Tem permissão para iniciar multiplos atendimentos para o time
    canSendMultipleMessages?: boolean;
}

export enum TeamPermissionTypes {
    canStartConversation = 'canStartConversation',
    canViewFinishedConversations = 'canViewFinishedConversations',
    canViewOpenTeamConversations = 'canViewOpenTeamConversations',
    canViewConversationContent = 'canViewConversationContent',
    canTransferConversations = 'canTransferConversations',
    canSendAudioMessage = 'canSendAudioMessage',
    canSendOfficialTemplate = 'canSendOfficialTemplate',
    canViewHistoricConversation = 'canViewHistoricConversation',
    canSendMultipleMessages = 'canSendMultipleMessages',
}

export interface TeamUser {
    userId: Types.ObjectId;
    isSupervisor: boolean;
    permission: TeamPermission;
}

interface AttendancePeriod {
    start: number;
    end: number;
}

export interface OffDaysPeriod extends AttendancePeriod {
    name: string;
    message?: string;
    cannotAssignEndConversation?: boolean;
}
export interface AttendancePeriods {
    mon: AttendancePeriod[];
    tue: AttendancePeriod[];
    wed: AttendancePeriod[];
    thu: AttendancePeriod[];
    fri: AttendancePeriod[];
    sat: AttendancePeriod[];
    sun: AttendancePeriod[];
}

export interface Team extends Document {
    name: string;
    workspaceId: Types.ObjectId;
    isDefaultTeam: boolean;
    roleUsers: TeamUser[];
    autoAssignToUser: boolean;
    priority: number;
    createdAt?: number;
    updatedAt?: number;
    attendancePeriods: AttendancePeriods;
    assignMessage?: string;
    cannotAssignMessage?: string;
    cannotAssignEndConversation?: boolean;
    notificationNewAttendance?: boolean;
    offDays?: OffDaysPeriod[];
    reassignConversationInterval?: number;
    viewPublicDashboard?: boolean;
    canReceiveTransfer?: boolean;
    inactivatedAt?: Date;
    deletedAt?: Date;
    requiredConversationCategorization?: boolean;
}
