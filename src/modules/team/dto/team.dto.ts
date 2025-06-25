import { AttendancePeriods, OffDaysPeriod } from "../interfaces/team.interface";

class TeamPermissionDto {
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
class TeamUserDto {
    userId: string;
    isSupervisor: boolean;
    permission: TeamPermissionDto;
}
export class CreateTeamDto{
    name: string;
    workspaceId: string;
    roleUsers: TeamUserDto[];
    reassignConversationInterval?: number;
}

export class UpdateTeamDto{
    name: string;
    roleUsers: TeamUserDto[];

    priority: number;
    attendancePeriods: AttendancePeriods;
    assignMessage?: string;
    cannotAssignMessage?: string;
    cannotAssignEndConversation?: boolean;
    notificationNewAttendance?: boolean;
    offDays?: OffDaysPeriod[];
    reassignConversationInterval?: number;
    viewPublicDashboard?: boolean;
    canReceiveTransfer?: boolean;
}