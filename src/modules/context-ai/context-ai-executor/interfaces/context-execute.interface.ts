import { IContextMessage } from '../../context-message/interfaces/context-message.interface';
import { IContextVariableResume } from '../../context-variable/interfaces/context-variables.interface';

interface ExecuteResponse {
    errorCode?: string;
    errorMessage?: string;
    error?: boolean;
    message: IContextMessage;
    variables: IContextVariableResume[];
}

export type { ExecuteResponse };
