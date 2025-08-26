import { IContextMessage } from '../../context-message/interfaces/context-message.interface';
import { IContextVariableResume } from '../../context-variable/interfaces/context-variables.interface';
import { IIntentActions } from '../../intent-detection/interfaces/intent-actions.interface';
import { IIntentDetection } from '../../intent-detection/interfaces/intent-detection.interface';

interface ExecuteResponse {
    errorCode?: string;
    errorMessage?: string;
    error?: boolean;
    message: IContextMessage;
    variables: IContextVariableResume[];
    intent?: {
        actions: IIntentActions[];
        detectedIntent: IIntentDetection;
        interaction: unknown;
    };
}

export type { ExecuteResponse };
