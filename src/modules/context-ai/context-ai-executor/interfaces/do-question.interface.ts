export interface DoQuestion {
    contextId: string;
    question: string;
    useHistoricMessages: boolean;
    fromInteractionId?: string;
    parameters?: DoQuestionParameters;
}

export interface DoQuestionParameters {
    paciente_cpf?: string;
    paciente_nascimento?: string;
    paciente_id?: string;
    paciente_nome?: string;
    integration_id?: string;
}
