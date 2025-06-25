import { Types } from 'mongoose';

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

interface TeamUser {
    userId: Types.ObjectId;
    isSupervisor: boolean;
    permission: TeamPermission;
}

export interface CreateTeamParams {
    name: string;
    roleUsers: TeamUser[];
    reassignConversationInterval?: number;
}
