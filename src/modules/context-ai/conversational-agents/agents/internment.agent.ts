import { Injectable } from '@nestjs/common';
import { BaseConversationalAgent } from '../base/base-conversational-agent';
import {
    ConversationExecutionParams,
    ConversationResult,
    ConversationState,
} from '../interfaces/conversational-agent.interface';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../../context-ai-executor/enums/ai-models.enum';

/**
 * Agente Conversacional para Internação
 *
 * Função:
 * - Atua como agente placeholder para interações sobre internação.
 * - Não possui informações específicas no momento.
 *
 * Comportamento Atual:
 * - Reconhece a necessidade do paciente com empatia.
 * - Informa gentilmente que não tem acesso a informações sobre internação.
 * - Pergunta se o usuário deseja ajuda com outra coisa.
 * - Finaliza o fluxo imediatamente.
 *
 * Objetivo:
 * Servir como uma camada de contenção empática para solicitações de internação,
 * evitando alucinações e mantendo a experiência humanizada até que o fluxo real
 * de internação esteja implementado.
 */
@Injectable()
export class InternmentAgent extends BaseConversationalAgent {
    private readonly DEFAULT_FALLBACK_MESSAGE =
        'Entendo que você precisa de informações sobre internação. Infelizmente, no momento eu não tenho essas informações específicas disponíveis para te passar.\n\nPosso te ajudar com algo mais?';

    constructor(private readonly aiProviderService: AiProviderService) {
        super({
            id: 'internment',
            name: 'Agente de Internação',
            description: 'Auxilia pacientes com dúvidas e processos relacionados a internação hospitalar',
            examples: {
                positive: [
                    'Preciso de informações sobre internação',
                    'Como funciona o processo de internação?',
                    'Quais documentos preciso para internar?',
                    'Vou fazer uma cirurgia, como funciona?',
                    'Pode me explicar sobre internação?',
                    'Meu pai vai ficar internado',
                    'Informações sobre hospitalização',
                    'Como dar entrada para internação?',
                ],
                negative: [],
            },
            systemPrompt: `
<AgentProfile>
Você é um assistente virtual do hospital, acionado para assuntos relacionados à internação.
No momento, você **não possui informações específicas sobre internação**.
Seu papel é responder de forma empática e humanizada, explicando que não tem acesso a esses dados e oferecendo ajuda para outros assuntos.
</AgentProfile>

<Objective>
Sempre responda com empatia e naturalidade informando que você **não possui informações sobre internação neste momento**.
Depois disso, pergunte se o usuário deseja ajuda com outra coisa.
Finalize o atendimento sempre com:
- state = "completed"
- shouldContinue = false
</Objective>

<BehavioralRules>
- Seja muito empático e acolhedor, especialmente se o usuário estiver frustrado.
- Sempre reconheça a necessidade do usuário antes de negar a informação.
- Use frases naturais como “Entendo”, “Compreendo”, “Sei que isso é importante”.
- Evite parecer robótico ou institucional.
- Nunca invente informações, nomes, contatos, horários ou procedimentos.
- Se a mensagem não for claramente sobre internação, responda de forma empática genérica e finalize do mesmo modo.
- Nunca colete informações nem faça perguntas sobre o processo de internação.
- Sempre finalize o atendimento após a resposta.
</BehavioralRules>

<ConversationFlow>
Qualquer mensagem do usuário deve gerar uma resposta que:
1. Reconheça a necessidade dele com empatia.
2. Informe gentilmente que você não possui informações sobre internação.
3. Pergunte se pode ajudar em outra coisa.
4. Marque "state": "completed" e "shouldContinue": false.
</ConversationFlow>

<OutputFormat>
Responda sempre em JSON no formato:

{
  "message": "Texto empático e natural com \\n\\n entre parágrafos",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["handoff", "end"]
}
</OutputFormat>

<Examples>
Usuário: "Preciso de informações sobre internação."
Saída:
{
  "message": "Entendo que você precisa de informações sobre internação. No momento, não tenho acesso a essas informações específicas, mas compreendo que isso é importante para você.\\n\\nPosso te ajudar com algo mais?",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["handoff", "end"]
}

Usuário: "Como funciona o processo de internação?"
Saída:
{
  "message": "Compreendo sua dúvida sobre o processo de internação. No momento, não disponho dessas informações específicas, mas estou aqui para te ajudar com outras questões se quiser.\\n\\nHá algo mais em que eu possa te auxiliar?",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["handoff", "end"]
}

Usuário: "Quais documentos preciso para internar?"
Saída:
{
  "message": "Sei que é importante saber sobre os documentos necessários. No momento, não tenho acesso a essas informações, mas posso te ajudar com outros assuntos se quiser.\\n\\nPosso te auxiliar em algo mais?",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["handoff", "end"]
}
</Examples>

`,
            maxTurns: 1,
            handoffConditions: {
                keywords: ['falar com alguém', 'atendente', 'humano', 'pessoa', 'urgente', 'emergência'],
            },
        });
    }

    async execute(params: ConversationExecutionParams): Promise<ConversationResult> {
        try {
            const { userMessage, conversationContext } = params;

            if (this.shouldHandoff(userMessage, conversationContext)) {
                return this.createResult(
                    'Compreendo. Vou te conectar com nossa equipe de internação para um atendimento personalizado. Aguarde um momento, por favor.',
                    ConversationState.HANDOFF_REQUESTED,
                    false,
                    null,
                );
            }

            const prompt = this.buildPrompt(params);
            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.7,
                model: DEFAULT_AI_MODEL,
                maxTokens: 512,
            });

            return this.parseResponse(aiResponse.message);
        } catch (error) {
            this.logger.error('Error in InternmentAgent execution:', error);

            return this.createResult(
                'Desculpe, tive um problema ao processar. Posso te ajudar com algo mais?',
                ConversationState.COMPLETED,
                false,
            );
        }
    }

    private parseResponse(aiMessage: string): ConversationResult {
        const aiResponse = this.parseAiResponse(aiMessage);

        if (aiResponse) {
            return {
                message: aiResponse.message || this.DEFAULT_FALLBACK_MESSAGE,
                state: ConversationState.COMPLETED,
                shouldContinue: false,
                collectedData: aiResponse.collectedData,
                suggestedActions: aiResponse.suggestedActions,
            };
        }

        return {
            message: aiMessage || this.DEFAULT_FALLBACK_MESSAGE,
            state: ConversationState.COMPLETED,
            shouldContinue: false,
        };
    }
}
