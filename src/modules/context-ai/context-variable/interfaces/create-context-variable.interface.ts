import { ContextVariableType } from './context-variables.interface';

export interface CreateContextVariable {
    name: string;
    value: string;
    botId?: string;
    type: ContextVariableType;
}
