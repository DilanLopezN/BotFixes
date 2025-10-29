import { IContextMessage } from '../../context-message/interfaces/context-message.interface';
import { IContextVariableResume } from '../../context-variable/interfaces/context-variables.interface';
import { IIntentActions } from '../../intent-detection/interfaces/intent-actions.interface';
import { IIntentDetection } from '../../intent-detection/interfaces/intent-detection.interface';

export enum ResponseType {
    COMPLETED = 'completed',
    CLARIFY = 'clarify',
    TOOL_EXECUTION = 'tool_execution',
    FALLBACK = 'fallback',
    ERROR = 'error',
}

interface ExecuteResponse {
    errorCode?: string;
    errorMessage?: string;
    error?: boolean;
    message: IContextMessage | IContextMessage[];
    variables: IContextVariableResume[];
    isAudio?: boolean;
    audioUrl?: string;
    nextStep?: Record<string, any>;
    intent?: {
        actions: IIntentActions[];
        detectedIntent: IIntentDetection;
        interaction: unknown;
    };
    isAggregated?: boolean;
    responseType?: ResponseType;
    traceId?: string;
}

export type { ExecuteResponse };
