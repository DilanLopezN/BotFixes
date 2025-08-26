export enum DefaultContextVariables {
    // variáveis de configuração de contexto
    clientName = 'clientName',
    botName = 'botName',
    maxCharacters = 'maxCharacters',
    temperature = 'temperature',
    historicMessagesLength = 'historicMessagesLength',
    customPersonality = 'customPersonality',
    time = 'time',
    customPrompt = 'customPrompt',

    // variáveis de fallback
    actionAfterFallback01 = 'action_after_fallback_01',
    actionAfterFallback02 = 'action_after_fallback_02',
    actionAfterFallback03 = 'action_after_fallback_03',
    actionAfterFallback04 = 'action_after_fallback_04',
    actionAfterFallback05 = 'action_after_fallback_05',

    // variáveis de ação, para card de sucesso
    btnAction01 = 'btn_action_01',
    btnAction02 = 'btn_action_02',
    btnAction03 = 'btn_action_03',

    // variáveis de ação, para card de fallback
    btnFallback01 = 'btn_fallback_01',
    btnFallback02 = 'btn_fallback_02',
    btnFallback03 = 'btn_fallback_03',

    // variáveis de goto direto, após resposta da ia para o paciente
    // realiza redirect imediato, ou seja aqui contem um interactionId
    actionAfterResponse = 'action_after_response',

    // variáveis de goto direto, após falha na resposta da ia para o paciente
    // realiza redirect imediato, ou seja aqui contem um interactionId
    actionAfterFallback = 'action_after_fallback',
}
