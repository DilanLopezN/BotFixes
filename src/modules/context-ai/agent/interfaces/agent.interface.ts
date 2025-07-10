export interface IAgent {
    id: string;
    name: string;
    description: string;
    prompt: string;
    personality: string;
    workspaceId: string;
    botId: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAgentData {
    name: string;
    description: string;
    personality: string;
    prompt?: string;
    workspaceId: string;
    botId: string;
    isDefault?: boolean;
}

export interface UpdateAgentData {
    agentId: string;
    name?: string;
    description?: string;
    personality?: string;
    prompt?: string;
    isDefault?: boolean;
    isActive?: boolean;
}

export interface DeleteAgentData {
    agentId: string;
}

export interface ListAgentsFilter {
    workspaceId: string;
    botId?: string;
    isActive?: boolean;
}
