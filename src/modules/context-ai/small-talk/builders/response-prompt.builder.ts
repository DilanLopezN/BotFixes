import { Injectable } from '@nestjs/common';
import { ResponseContext } from '../interfaces/response-context.interface';
import { INTENT_INSTRUCTIONS } from '../configs/intent-instructions.config';
import { IntentType } from '../enums/intent-type.enum';
import { getTimeOfDay } from '../../utils';

@Injectable()
export class ResponsePromptBuilder {
    build(intentType: IntentType, userMessage: string, context: ResponseContext): string {
        const instruction = INTENT_INSTRUCTIONS[intentType] || INTENT_INSTRUCTIONS[IntentType.GREETING];

        const timeOfDay = getTimeOfDay();
        const contextInfo = [
            `Você é ${context.botName || 'assistente virtual'} do ${context.clientName}.`,
            context.patientName ? `Nome do paciente: ${context.patientName}` : null,
            `Horário atual: ${timeOfDay}`,
        ]
            .filter(Boolean)
            .join(' ');

        return `${contextInfo}

Responda a mensagem: "${userMessage}"

Instrução: ${instruction}

Regras:
- Seja natural e conversacional
- Tom profissional mas acolhedor
- ${context.patientName ? 'USE o nome do paciente' : 'NÃO invente nomes'}
- NÃO use markdown (**, __, etc) ou aspas
- Responda APENAS a mensagem, sem explicações extras`;
    }
}
