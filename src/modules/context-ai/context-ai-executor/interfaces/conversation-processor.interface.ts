import { IAgent } from '../../agent/interfaces/agent.interface';
import { DoQuestionParameters } from './do-question.interface';
import { ActionKey } from '../../conversational-agents/interfaces/conversational-agent.interface';

export enum ProcessorType {
    RAG = 'rag',
    QUESTION_REWRITE = 'question-rewrite',
    SMALL_TALK = 'small-talk',
    TOOL = 'tool',
    GUARDRAILS = 'guardrails',
    GUARDRAILS_SECURITY = 'guardrails-security',
    GUARDRAILS_QUICK = 'guardrails-quick',
}

export enum RewriteDecision {
    COPY = 'COPY',
    REWRITE = 'REWRITE',
    CLARIFY = 'CLARIFY',
}

export interface RewriteMetadata {
    originalMessage?: string;
    wasRewritten?: boolean;
    rewriteDecision?: RewriteDecision;
    rewriteReason?: string;
}

export interface ClarificationContext {
    waitingForClarification: boolean;
    clarificationQuestion?: string;
    clarificationTimestamp?: number;
}

export interface NextStep {
    suggestedActions?: Array<{
        label: string;
        value: string;
        type?: ActionKey;
    }>;
    [key: string]: any;
}

export interface ProcessingMetadata extends RewriteMetadata {
    nextStep?: NextStep;
    clarificationContext?: ClarificationContext;
    [key: string]: any;
}

export interface ProcessingContext {
    agent: IAgent;
    message: string;
    contextId: string;
    workspaceId: string;
    referenceId: string;
    parameters?: DoQuestionParameters;
    metadata?: ProcessingMetadata;
    debug?: boolean;
    audioContext?: {
        fromAudio: boolean;
        shouldGenerateAudio?: boolean;
    };
}

export interface ProcessingResult {
    content: string | null;
    shouldContinue: boolean;
    metadata?: Record<string, any>;
    nextStep?: NextStep;
    audioRequest?: {
        shouldGenerateAudio: boolean;
        processorType: string;
    };
    traceId?: string;
}

export interface ConversationProcessor {
    readonly name: string;
    priority: number;
    canHandle(context: ProcessingContext): Promise<boolean>;
    process(context: ProcessingContext): Promise<ProcessingResult>;
}

export interface ConversationOrchestrator {
    process(context: ProcessingContext): Promise<ProcessingResult>;
    registerProcessor(processor: ConversationProcessor): void;
    getProcessors(): ConversationProcessor[];
}
