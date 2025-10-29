export interface ConversationTrace {
    traceId: string;
    contextId: string;
    workspaceId: string;
    agentId: string;
    startTime: string;
    endTime?: string;
    durationMs?: number;
    userMessage: string;
    finalResponse?: string;
    processors: ProcessorTrace[];
    metadata: ConversationTraceMetadata;
}

export interface ProcessorTrace {
    processorName: string;
    priority: number;
    startTime: string;
    endTime: string; 
    durationMs: number;
    status: ProcessorStatus;
    canHandle: boolean;
    input?: any;
    output?: any;
    error?: string;
    decision?: ProcessorDecision;
}

export enum ProcessorStatus {
    SKIPPED = 'SKIPPED', // canHandle = false
    EXECUTED_CONTINUE = 'EXECUTED_CONTINUE', // Executou mas continua
    EXECUTED_STOP = 'EXECUTED_STOP', // Executou e parou (gerou resposta)
    ERROR = 'ERROR', // Erro na execução
}

export interface ProcessorDecision {
    reason: string; // Por que este processor foi executado/parado
    confidence?: number; // Confiança na decisão (0-1)
    metadata?: Record<string, any>; // Dados adicionais da decisão
}

export interface ConversationTraceMetadata {
    debugMode: boolean;
    totalProcessorsExecuted: number;
    totalProcessorsSkipped: number;
    responseSource?: string; // Qual processor gerou a resposta
    responseType?: string; // tool, rag, small_talk, etc.
    hasErrors: boolean;
    errors?: string[];
    tags?: string[];
}

export interface ConversationTraceService {
    startTrace(params: {
        contextId: string;
        workspaceId: string;
        agentId: string;
        userMessage: string;
        debugMode: boolean;
    }): Promise<ConversationTrace>;
    addProcessorTrace(traceId: string, processorTrace: ProcessorTrace): Promise<void>;
    endTrace(traceId: string, finalResponse: string): Promise<void>;
    getTrace(traceId: string, workspaceId: string): Promise<ConversationTrace | null>;
    getTracesByContext(contextId: string, limit?: number, workspaceId?: string): Promise<ConversationTrace[]>;
}

export interface TraceSearchFilters {
    workspaceId?: string;
    agentId?: string;
    contextId?: string;
    processorName?: string;
    status?: ProcessorStatus;
    hasErrors?: boolean;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
}
