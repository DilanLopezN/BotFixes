import { AiProviderService } from '../../../../ai-provider/ai.service';
import { Appointment } from './list-appointments.interfaces';
import { AppointmentAction, InitialIntent } from '../../interfaces/skill-session.interface';
import { Logger } from '@nestjs/common';

export enum ConfirmationIntent {
    CONFIRM = 'confirm',
    DENY = 'deny',
    UNCLEAR = 'unclear',
}

export class ListAppointmentsPrompts {
    private static readonly logger = new Logger(ListAppointmentsPrompts.name);

    static async parseConfirmationResponse(
        aiProviderService: AiProviderService,
        userMessage: string,
    ): Promise<{
        intent: ConfirmationIntent;
        confidence: number;
    }> {
        try {
            const result = await aiProviderService.execute({
                prompt: this.getConfirmationResponsePrompt(userMessage),
                temperature: 0.1,
                maxTokens: 50,
            });

            const parsed = JSON.parse(result.message);

            return {
                intent: parsed.intent || ConfirmationIntent.UNCLEAR,
                confidence: parsed.confidence || 0,
            };
        } catch (error) {
            this.logger.error('Error parsing confirmation response:', error);
            return {
                intent: ConfirmationIntent.UNCLEAR,
                confidence: 0,
            };
        }
    }

    static async parseActionCommand(
        aiProviderService: AiProviderService,
        userMessage: string,
        appointments: Appointment[],
    ): Promise<{
        actions: Array<{
            action: AppointmentAction.CANCEL | AppointmentAction.CONFIRM;
            indices: number[];
            confidence: number;
        }>;
    }> {
        const totalAppointments = appointments.length;

        const appointmentsList = appointments
            .map((apt, index) => {
                const date = new Date(apt.appointmentDate);
                const dateStr = date.toLocaleDateString('pt-BR');
                const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return `[${index + 1}] ${dateStr} às ${timeStr} - ${apt.doctor.friendlyName} - ${
                    apt.speciality.friendlyName
                }`;
            })
            .join('\n');

        try {
            const result = await aiProviderService.execute({
                prompt: this.getActionCommandPrompt(userMessage, appointmentsList, totalAppointments),
                temperature: 0.1,
                maxTokens: 200,
            });

            const parsed = JSON.parse(result.message);

            const actions = (parsed.actions || [])
                .map((actionItem: any) => {
                    const validIndices = (actionItem.indices || [])
                        .filter((i: number) => i >= 1 && i <= totalAppointments)
                        .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i)
                        .sort((a: number, b: number) => a - b);

                    return {
                        action: actionItem.action,
                        indices: validIndices,
                        confidence: actionItem.confidence || 0,
                    };
                })
                .filter((actionItem: any) => actionItem.indices.length > 0 && actionItem.confidence >= 0.5);

            return {
                actions,
            };
        } catch (error) {
            this.logger.error('Error parsing action command:', error);
            return {
                actions: [],
            };
        }
    }

    private static getConfirmationResponsePrompt(userMessage: string): string {
        return `
Você é um classificador especializado em interpretar respostas de confirmação do usuário.

SUA TAREFA:
Analise a mensagem do usuário e classifique a intenção como:
- "confirm": o usuário está CONFIRMANDO/ACEITANDO a operação
- "deny": o usuário está NEGANDO/RECUSANDO a operação
- "unclear": não ficou claro ou o usuário mudou de assunto

MENSAGEM DO USUÁRIO: "${userMessage}"

EXEMPLOS DE CONFIRMAÇÃO (intent: "confirm"):
- "sim"
- "pode ir"
- "confirmo"
- "tá bom"
- "beleza"
- "com certeza"
- "quero sim"
- "ok"
- "pode fazer"
- "isso mesmo"
- "correto"
- "exato"

EXEMPLOS DE NEGAÇÃO (intent: "deny"):
- "não"
- "não quero"
- "cancela"
- "desiste"
- "melhor não"
- "deixa pra lá"
- "esquece"
- "mudei de ideia"

EXEMPLOS DE NÃO CLARO (intent: "unclear"):
- "talvez"
- "não sei"
- "o que você acha?"
- "quero ver meus horários" (mudou de assunto)
- "quanto custa?" (mudou de assunto)

FORMATO DE RESPOSTA (JSON):
{
  "intent": "confirm" | "deny" | "unclear",
  "confidence": 0.0 a 1.0
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.
`;
    }

    static getActionCommandPrompt(userMessage: string, appointmentsList: string, totalAppointments: number): string {
        return `
Você é um parser especializado em interpretar comandos do usuário relacionados a ações em agendamentos médicos.

CONTEXTO:
O usuário está visualizando os seguintes agendamentos:

${appointmentsList}

SUA TAREFA:
Analise o comando do usuário e extraia TODAS as ações mencionadas. O usuário pode solicitar MÚLTIPLAS AÇÕES diferentes na mesma mensagem.

MENSAGEM DO USUÁRIO: "${userMessage}"

REGRAS DE INTERPRETAÇÃO:

1. AÇÕES VÁLIDAS:
   - "cancelar" / "desmarcar" / "excluir" → action: "cancel"
   - "confirmar" / "manter" → action: "confirm"

2. MÚLTIPLAS AÇÕES:
   - O usuário pode pedir para cancelar alguns agendamentos E confirmar outros na mesma mensagem
   - Exemplo: "cancela o ginecologia e confirma a consulta de neurologista"
   - Cada ação deve ser retornada separadamente no array de actions

3. ALVOS (quais agendamentos):
   - Por número: "1", "2 e 3", "o primeiro", "o segundo" → retornar os índices correspondentes
   - Por data/hora: "do dia 27/10", "às 13h", "de amanhã" → identificar qual agendamento corresponde
   - Por médico/especialidade: "com Dr. João", "de cardiologia" → identificar qual agendamento pela especialidade
   - "todos" / "todas" / "tudo" → todos os agendamentos (índices: [1, 2, 3, ..., ${totalAppointments}])
   - "o resto" / "os outros" / "demais" → todos exceto os já mencionados

4. EXEMPLOS DE INTERPRETAÇÃO:
   - "cancelar 1" → actions: [{ action: "cancel", indices: [1], confidence: 0.95 }]
   - "confirmar todos" → actions: [{ action: "confirm", indices: [1, 2, ..., ${totalAppointments}], confidence: 0.95 }]
   - "cancela o ginecologia e confirma a neurologista" → actions: [
       { action: "cancel", indices: [índice do agendamento de ginecologia], confidence: 0.90 },
       { action: "confirm", indices: [índice do agendamento de neurologista], confidence: 0.90 }
     ]
   - "cancelar o primeiro e confirmar o segundo" → actions: [
       { action: "cancel", indices: [1], confidence: 0.95 },
       { action: "confirm", indices: [2], confidence: 0.95 }
     ]

5. SE NÃO IDENTIFICAR NENHUMA AÇÃO CLARA:
   - Retornar array vazio: actions: []

6. VALIDAÇÃO:
   - Apenas retornar índices entre 1 e ${totalAppointments}
   - Remover duplicatas dentro de cada ação
   - Ordenar índices
   - Cada agendamento pode aparecer em apenas UMA ação

FORMATO DE RESPOSTA (JSON):
{
  "actions": [
    {
      "action": "cancel" | "confirm",
      "indices": [1, 2, 3],
      "confidence": 0.0 a 1.0
    }
  ]
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.
`;
    }

    static async detectInitialIntent(
        aiProviderService: AiProviderService,
        userMessage: string,
    ): Promise<
        | ({ hasIntent: true; confidence: number } & InitialIntent)
        | { hasIntent: false; confidence: number; action?: undefined; target?: undefined }
    > {
        try {
            const result = await aiProviderService.execute({
                prompt: this.getInitialIntentPrompt(userMessage),
                temperature: 0.1,
                maxTokens: 100,
            });

            const parsed = JSON.parse(result.message);
            return {
                hasIntent: parsed.hasIntent || false,
                action: parsed.action,
                target: parsed.target,
                confidence: parsed.confidence || 0,
            };
        } catch (error) {
            this.logger.error('Error detecting initial intent:', error);
            return {
                hasIntent: false,
                confidence: 0,
            };
        }
    }

    private static getInitialIntentPrompt(userMessage: string): string {
        return `
Analise a mensagem do usuário e identifique se ele já expressa uma INTENÇÃO de ação sobre agendamentos.

MENSAGEM DO USUÁRIO:
"${userMessage}"

INSTRUÇÕES:

1. IDENTIFICAR SE HÁ INTENÇÃO CLARA:
   - Cancelar agendamentos: "quero cancelar", "preciso cancelar", "cancelar meus agendamentos", etc.
   - Confirmar agendamentos: "quero confirmar", "preciso confirmar", "confirmar minha consulta", etc.
   - Apenas ver/listar agendamentos NÃO é uma intenção de ação

2. IDENTIFICAR O ALVO (target):
   - "all" se mencionar: "todos", "todas", "meus agendamentos" (plural sem especificar qual)
   - null se não especificar ou se for apenas um interesse geral

3. CONFIANÇA (confidence):
   - Alta (0.9+): Intenção muito clara e específica
   - Média (0.7-0.9): Intenção presente mas não muito específica
   - Baixa (< 0.7): Intenção ambígua ou incerta

4. SE NÃO HOUVER INTENÇÃO CLARA:
   - hasIntent: false
   - Não retornar action nem target

EXEMPLOS:
"Quero cancelar meus agendamentos" → hasIntent: true, action: "cancel", target: "all", confidence: 0.95
"Preciso confirmar minha consulta" → hasIntent: true, action: "confirm", target: null, confidence: 0.85
"Ver meus agendamentos" → hasIntent: false
"Quais são minhas consultas?" → hasIntent: false
"Cancelar todos" → hasIntent: true, action: "cancel", target: "all", confidence: 0.9

FORMATO DE RESPOSTA (JSON):
{
  "hasIntent": true | false,
  "action": "cancel" | "confirm" (somente se hasIntent true),
  "target": "all" | null (somente se hasIntent true),
  "confidence": 0.0 a 1.0
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.
`;
    }
}
