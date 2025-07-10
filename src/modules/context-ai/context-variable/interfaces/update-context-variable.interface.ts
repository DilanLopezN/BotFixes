import { ContextVariableType } from './context-variables.interface';

export interface UpdateContextVariable {
    contextVariableId: string;
    name: string;
    value: string;
    botId?: string;
    agentId: string;
    type: ContextVariableType;
}
