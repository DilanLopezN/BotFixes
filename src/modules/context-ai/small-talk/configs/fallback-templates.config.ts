import { IntentType } from '../enums/intent-type.enum';
import { ResponseContext } from '../interfaces/response-context.interface';

export const FALLBACK_TEMPLATES: Record<IntentType, (ctx: ResponseContext) => string> = {
    [IntentType.GREETING]: (ctx: ResponseContext) =>
        `Olá${ctx.patientName ? ', ' + ctx.patientName : ''}! Sou ${ctx.botName || 'assistente virtual'} do ${
            ctx.clientName
        }. Como posso ajudar?`,

    [IntentType.THANKS]: (ctx: ResponseContext) =>
        `Que bom ter ajudado${ctx.patientName ? ', ' + ctx.patientName : ''}! Sempre que precisar, estarei por aqui.`,

    [IntentType.FAREWELL]: (ctx: ResponseContext) =>
        `Até logo${ctx.patientName ? ', ' + ctx.patientName : ''}! O ${ctx.clientName} estará sempre à disposição.`,

    [IntentType.MENU]: (ctx: ResponseContext) =>
        `Posso ajudar com informações sobre o ${ctx.clientName}, consultas, exames, médicos e especialidades. Como posso ajudar?`,

    [IntentType.OFF_TOPIC]: (ctx: ResponseContext) =>
        `Desculpe, não consegui processar essa mensagem. Estou aqui para ajudar com informações sobre o ${ctx.clientName}.`,

    [IntentType.END_SERVICE]: (ctx: ResponseContext) =>
        `Atendimento encerrado. Obrigado pelo contato! O ${ctx.clientName} estará sempre à disposição.`,

    [IntentType.EMOJI]: () => '😊',
    [IntentType.NONE]: () => 'Como posso ajudar?',
};
