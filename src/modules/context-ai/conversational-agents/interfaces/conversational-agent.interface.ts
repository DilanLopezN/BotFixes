import { IAgent } from '../../agent/interfaces/agent.interface';

export enum ConversationState {
    INITIAL = 'initial', // Primeira interação
    COLLECTING_INFO = 'collecting_info', // Coletando informações
    PROCESSING = 'processing', // Processando solicitação
    WAITING_CONFIRMATION = 'waiting_confirmation', // Aguardando confirmação
    COMPLETED = 'completed', // Conversa concluída
    HANDOFF_REQUESTED = 'handoff_requested', // Solicitou transferência para humano
}

export interface ConversationContext {
    agentId: string; // ID do agente conversacional (ex: 'internacao', 'reclamacao')
    state: ConversationState;
    collectedData: Record<string, any>; // Dados coletados durante conversa
    messageHistory: Array<{
        role: 'user' | 'agent';
        content: string;
        timestamp: string;
    }>;
    metadata?: {
        startedAt: string;
        lastActivityAt: string;
        attempts?: number;
        handoffReason?: string;
        [key: string]: any;
    };
}

export enum ActionKey {
    HANDOFF = 'handoff',
    MESSAGE = 'message',
    END = 'end',
    CONTINUE = 'continue',
    RESCHEDULE = 'reschedule',
    CANCEL = 'cancel',
}

export interface SuggestedAction {
    label: string;
    value: string;
    type?: ActionKey;
}

export interface ParsedAiResponse {
    message: string;
    state?: string;
    shouldContinue?: boolean;
    collectedData?: Record<string, any>;
    suggestedActions?: SuggestedAction[] | ActionKey[];
}

export interface ConversationResult {
    message: string; // Mensagem para o usuário
    state: ConversationState;
    shouldContinue: boolean; // Se deve manter a conversa ativa
    collectedData?: Record<string, any>; // Dados coletados durante a interação
    suggestedActions?: SuggestedAction[] | ActionKey[];
    nextStep?: any;
}

export interface ConversationExecutionParams {
    agent: string | IAgent;
    userMessage: string;
    contextId: string;
    conversationContext?: ConversationContext;
    metadata?: Record<string, any>;
}

export interface ConversationalAgent {
    readonly id: string;

    readonly name: string;

    readonly description: string;

    readonly examples: {
        positive: string[]; // Devem ativar
        negative: string[]; // NÃO devem ativar
    };

    execute(params: ConversationExecutionParams): Promise<ConversationResult>;
    canHandle(message: string, context?: ConversationContext): boolean;
    buildPrompt(params: ConversationExecutionParams): string;
}

export interface ConversationalAgentConfig {
    id: string;
    name: string;
    description: string;
    examples: {
        positive: string[];
        negative: string[];
    };
    systemPrompt: string; // Prompt base do agente
    maxTurns?: number; // Máximo de interações antes de handoff
    handoffConditions?: {
        keywords?: string[]; // Palavras que triggam handoff
        states?: ConversationState[]; // Estados que triggam handoff
    };
}
