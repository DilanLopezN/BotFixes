import { IAgent } from '../../agent/interfaces/agent.interface';
import { ActionKey } from '../../conversational-agents/interfaces/conversational-agent.interface';

export type ToolType = 'action' | 'intent';

export interface ToolExamples {
    positive: string[];
    negative: string[];
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface Tool {
    id: string;
    name: string;
    type: ToolType;
    description: string;
    examples: ToolExamples;
    execute(agent: IAgent, args?: Record<string, any>): Promise<unknown>;
    generatePrompt?(data: unknown, userMessage: string, conversationHistory?: ConversationMessage[]): string;
}

export interface ToolExecutionContext {
    contextId: string;
    message: string;
    workspaceId: string;
    agentId: string;
    metadata?: Record<string, any>;
}

export interface SuggestedAction {
    label: string;
    value: string;
    type?: ActionKey;
}

export interface ToolResult {
    message?: string;
    data?: unknown;
    nextStep?: {
        intent: string;
        confidence: number;
        reason?: string;
        entities?: Record<string, any>;
        treeImmediately?: boolean;
    };
    requiresInput?: boolean;
    isComplete?: boolean;
    suggestedActions?: SuggestedAction[];
}

export interface ToolWithSession extends Tool {
    hasActiveSession(contextId: string): Promise<boolean>;
}

export interface ToolDetectionResponse {
    toolId: string | null;
    confidence: number;
    reason?: string;
}
