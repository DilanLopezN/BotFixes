import { RewriteDecision } from '../../context-ai-executor/interfaces/conversation-processor.interface';

export interface HistoryEvidence {
    turn: number;
    span: string;
}

export interface RewriteResponse {
    decision: RewriteDecision;
    rewritten: string;
    reason: string;
    evidence: HistoryEvidence[];
    clarification?: string;
}

export interface RewriteResult {
    question: string;
    decision: RewriteDecision;
}

export interface RewriteQuestionParams {
    agent: any;
    contextId: string;
    question: string;
    referenceId: string;
}
