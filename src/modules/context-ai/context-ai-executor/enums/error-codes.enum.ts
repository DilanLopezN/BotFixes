export enum DoQuestionErrorCode {
    /** ERR_01 - Nenhum agente ativo encontrado no workspace */
    NO_ACTIVE_AGENTS = 'ERR_01',

    /** ERR_02 - Nenhum processador conseguiu lidar com a requisição */
    NO_PROCESSORS_HANDLED = 'ERR_02',

    /** ERR_03 - Erro interno de processamento (catch genérico) */
    INTERNAL_PROCESSING_ERROR = 'ERR_03',
}

export const ERROR_MESSAGES = {
    [DoQuestionErrorCode.NO_ACTIVE_AGENTS]: 'No active agents found.',
    [DoQuestionErrorCode.NO_PROCESSORS_HANDLED]: 'No processors could handle the request.',
    [DoQuestionErrorCode.INTERNAL_PROCESSING_ERROR]: 'Internal processing error.',
} as const;

export const ERROR_DESCRIPTIONS = {
    [DoQuestionErrorCode.NO_ACTIVE_AGENTS]:
        'Workspace não possui agentes do tipo RAG ativos. Verifique se existe pelo menos um agente configurado e ativo.',

    [DoQuestionErrorCode.NO_PROCESSORS_HANDLED]:
        'Todos os processadores (QuestionRewrite, GreetingInterceptor, Skill, RAG) falharam ou não conseguiram processar a requisição.',

    [DoQuestionErrorCode.INTERNAL_PROCESSING_ERROR]:
        'Erro não tratado durante o processamento. Verifique logs para mais detalhes sobre a causa raiz.',
} as const;
