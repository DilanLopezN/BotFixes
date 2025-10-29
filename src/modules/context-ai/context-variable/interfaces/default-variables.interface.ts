export enum DefaultContextVariables {
    // variáveis de configuração de contexto
    clientName = 'clientName',
    botName = 'botName',
    maxCharacters = 'maxCharacters',
    temperature = 'temperature',
    historicMessagesLength = 'historicMessagesLength',
    time = 'time',
    customPrompt = 'customPrompt',

    // variáveis de goto direto, após resposta da ia para o paciente
    // realiza redirect imediato, ou seja aqui contem um interactionId
    actionAfterResponse = 'action_after_response',

    // variáveis de goto direto, após falha na resposta da ia para o paciente
    // realiza redirect imediato, ou seja aqui contem um interactionId
    actionAfterFallback = 'action_after_fallback',
}
