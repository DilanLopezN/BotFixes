export interface DoQuestion {
    workspaceId: string;
    contextId: string;
    question: string;
    fromInteractionId?: string;
    botId?: string;
    fromAudio?: boolean;
    parameters?: DoQuestionParameters;
    debug?: boolean;
    agentId?: string;
    isStartMessage?: boolean;
}

export interface DoQuestionParameters {
    paciente_cpf?: string;
    paciente_nascimento?: string;
    paciente_id?: string;
    paciente_nome?: string;
    integration_id?: string;
}
