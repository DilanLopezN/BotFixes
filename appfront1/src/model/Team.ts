import { ConversationStatus, IdentityType } from 'kissbot-core';
import { User } from 'kissbot-core';
import { Identity } from '../modules/liveAgent/interfaces/conversation.interface';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../utils/UserPermission';

export enum TeamPermissionTypes {
    canStartConversation = 'canStartConversation',
    canViewFinishedConversations = 'canViewFinishedConversations',
    canViewOpenTeamConversations = 'canViewOpenTeamConversations',
    canViewConversationContent = 'canViewConversationContent',
    canTransferConversations = 'canTransferConversations',
    canSendAudioMessage = 'canSendAudioMessage',
    canSendOfficialTemplate = 'canSendOfficialTemplate',
    canViewHistoricConversation = 'canViewHistoricConversation',
}

enum WeekDays {
    mon = 'mon',
    tue = 'tue',
    wed = 'wed',
    thu = 'thu',
    fri = 'fri',
    sat = 'sat',
    sun = 'sun',
}

export type TeamPermission = { [key in keyof typeof TeamPermissionTypes]: boolean };

export interface TeamUser {
    userId: string;
    isSupervisor: boolean;
    permission: TeamPermission;
}

interface AttendancePeriod {
    start: number;
    end: number;
}

export interface OffDaysPeriod extends AttendancePeriod {
    name?: string;
    message?: string;
    cannotAssignEndConversation?: boolean;
}

type AttendancePeriods = { [key in keyof typeof WeekDays]: AttendancePeriod[] };

export interface Team {
    _id: string;
    name: string;
    workspaceId: string;
    roleUsers: TeamUser[];
    priority: number;
    color: string;
    createdAt?: number;
    updatedAt?: number;
    attendancePeriods: AttendancePeriods;
    assignMessage?: string;
    cannotAssignMessage?: string;
    cannotAssignEndConversation?: boolean;
    notificationNewAttendance?: boolean;
    offDays?: OffDaysPeriod[];
    reassignConversationInterval?: number | null;
    viewPublicDashboard?: boolean;
    inactivatedAt?: string;
    requiredConversationCategorization?: boolean;
}

const validateTeamPermission = (
    teams: Team[],
    currentTeamId: string,
    targetPermission: TeamPermissionTypes,
    loggedUser: User,
    workspaceId: string
): boolean => {
    const { _id: loggedUserId } = loggedUser;

    const workspaceAdmin = isWorkspaceAdmin(loggedUser, workspaceId);
    const anySystemAdmin = isAnySystemAdmin(loggedUser);

    if (workspaceAdmin || anySystemAdmin) {
        return true;
    }

    const team = teams.find((team) => team._id === currentTeamId);
    if (!team) {
        return false;
    }

    // se usuário nao está no array de usuários do time, não tem permissão de nada
    const existentUser = team.roleUsers.find((user) => user.userId === loggedUserId);
    if (!existentUser) {
        return false;
    }

    // supervisor tem acesso a todas as permissões
    if (existentUser.isSupervisor) {
        return true;
    }

    return !!team.roleUsers.find((user) => user.userId === loggedUserId && !!user.permission?.[targetPermission]);
};

const validateCanViewConversation = ({ conversation, loggedUser, teams, workspaceId }): boolean => {
    const loggedAgent = ((conversation.members as Identity[]) ?? []).find((member) => member.id === loggedUser._id);

    // se usuário já participou da conversa permite-se que continue
    // vendo as mensagens mesmo que não tenha permissão no time atual da conversa
    if (!!loggedAgent || !conversation.assignedToTeamId || conversation.state !== ConversationStatus.open) {
        return true;
    }

    const havePermissionConversationContent = validateTeamPermission(
        teams,
        conversation.assignedToTeamId,
        TeamPermissionTypes.canViewConversationContent,
        loggedUser,
        workspaceId as string
    );

    const havePermissionHistoricConversation = validateTeamPermission(
        teams,
        conversation.assignedToTeamId,
        TeamPermissionTypes.canViewHistoricConversation,
        loggedUser,
        workspaceId as string
    );

    const hasPermissionViewOpenTeamConversations = validateTeamPermission(
        teams,
        conversation.assignedToTeamId,
        TeamPermissionTypes.canViewOpenTeamConversations,
        loggedUser,
        workspaceId as string
    );

    const activeConversationAgents = (conversation.members as Identity[]).filter(
        (member) => member.type === IdentityType.agent && !member.disabled
    );

    return (
        (activeConversationAgents?.length && hasPermissionViewOpenTeamConversations) ||
        conversation.assumed ||
        havePermissionConversationContent ||
        (conversation.state === ConversationStatus.closed && havePermissionHistoricConversation)
    );
};

export { validateTeamPermission, validateCanViewConversation };
