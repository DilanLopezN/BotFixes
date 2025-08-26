import { AgentType } from '../entities/agent.entity';

export { AgentType };

export enum AgentMode {
    FREE = 'free', // pode gerar respostas livremente
    RAG_ONLY = 'rag_only', // usa apenas o conteúdo do RAG
}

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
    agentMode: AgentMode;
    modelName: string;
    agentType: AgentType;
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
    agentType?: AgentType;
}

export interface UpdateAgentData {
    agentId: string;
    name?: string;
    description?: string;
    personality?: string;
    prompt?: string;
    isDefault?: boolean;
    isActive?: boolean;
    agentType?: AgentType;
}

export interface DeleteAgentData {
    agentId: string;
}

export interface ListAgentsFilter {
    workspaceId: string;
    botId?: string;
    isActive?: boolean;
    agentType?: AgentType;
}
