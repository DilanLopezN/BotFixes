export interface AgentWorkload {
    id: string;
    name: string;
    email: string;
    teamId: string;
    currentConversations: number;
    lastAssignedAt?: Date;
}

export interface AgentDistributionContext {
    workspaceId: string;
    teamId: string;
    conversationId: string;
    lastAssignedAgentId?: string;
}
