import { AiMessage } from '../../ai-provider/interfaces';

export enum ContextSwitchClassification {
    CONTINUATION = 'CONTINUATION', // Usuário continua no contexto atual
    CONTEXT_SWITCH = 'CONTEXT_SWITCH', // Mudou completamente de assunto
    CLARIFICATION = 'CLARIFICATION', // Pedindo esclarecimento sobre contexto atual
    AMBIGUOUS = 'AMBIGUOUS', // Não está claro
}

export interface ContextSwitchAnalysis {
    classification: ContextSwitchClassification;
    confidence: number;
    reason: string;
    isContinuation: boolean;
    isContextSwitch: boolean;
    isClarification: boolean;
}

export interface ContextSwitchDetectionParams {
    activeSkillName: string;
    activeSkillDescription?: string;
    awaitingInput: string; // "waiting_for_cpf", "waiting_for_birth_date", etc.
    newUserMessage: string;
    historicMessages?: AiMessage[];
}
