import { IContextMessage } from '../../context-message/interfaces/context-message.interface';
import { IContextVariableResume } from '../../context-variable/interfaces/context-variables.interface';

interface ExecuteResponse {
    error?: boolean;
    message: IContextMessage;
    variables: IContextVariableResume[];
}

export type { ExecuteResponse };
