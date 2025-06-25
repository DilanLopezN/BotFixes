interface IContextVariable {
    id: string;
    name: string;
    value: string;
    workspaceId: string;
    botId?: string;
    contextId?: string;
    type: ContextVariableType;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

enum ContextVariableType {
    custom = 'custom',
    context_config = 'context_config',
    action_fallback = 'action_fallback',
    action_button = 'action_button',
    action_redirect = 'action_redirect',
    error_handler = 'error_handler',
}

type IContextVariableResume = Pick<IContextVariable, 'id' | 'name' | 'value'>;

export { ContextVariableType };
export type { IContextVariable, IContextVariableResume };
