// isso aqui futuramente pode ser um detector de entidades do agente
export enum UserIntent {
    Agendamento = 'agendamento',
    ConsultaPreco = 'consulta_preco',
    VerificacaoPlano = 'verificacao_plano',
    InformacaoProcedimento = 'informacao_procedimento',
    InformacaoMedico = 'informacao_medico',
    InformacaoGeral = 'informacao_geral',
    DuvidaGenerica = 'duvida_generica',
    Cancelamento = 'cancelamento',
    ReclamacaoElogio = 'reclamacao_elogio',
    SuporteTecnico = 'suporte_tecnico',
    ResultadoExame = 'resultado_exame',
    FormaPagamento = 'forma_pagamento',
}

export type NextStepMapEntities = {
    doctor_name: string | null;
    procedure_name: string | null;
    specialty: string | null;
    health_plan: string | null;
};

export type NextStepMap = {
    intent: UserIntent;
    entities: NextStepMapEntities;
};

export interface AiProviderResponse {
    result: {
        next_step_map: NextStepMap;
        response: string;
    };
    error: string | null;
}

export enum AiProviderError {
    ContextIrrelevant = 'ERR_01',
    InvalidQuestion = 'ERR_02',
    ContextNotFound = 'ERR_03',
}

export const DEFAULT_PATTERN_ERROR_TOKEN = 'ERR_';
