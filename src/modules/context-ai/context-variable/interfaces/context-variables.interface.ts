interface IContextVariable {
    id: string;
    name: string;
    value: string;
    workspaceId: string;
    contextId?: string;
    agentId: string;
    type: ContextVariableType;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

enum ContextVariableType {
    custom = 'custom',
    // variáveis pré definidas em código que serão populadas dentro do prompt do agente
    context_config = 'context_config',
    action_fallback = 'action_fallback',
    action_button = 'action_button',
    // redireciona para proxima interaction
    action_redirect = 'action_redirect',
    error_handler = 'error_handler',
    entity = 'entity',
}

type IContextVariableResume = Pick<IContextVariable, 'id' | 'name' | 'value'>;

export { ContextVariableType };
export type { IContextVariable, IContextVariableResume };
