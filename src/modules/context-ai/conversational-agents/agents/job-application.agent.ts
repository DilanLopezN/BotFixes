import { Injectable } from '@nestjs/common';
import { BaseConversationalAgent } from '../base/base-conversational-agent';
import {
    ConversationExecutionParams,
    ConversationResult,
    ConversationState,
    ActionKey,
} from '../interfaces/conversational-agent.interface';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../../context-ai-executor/enums/ai-models.enum';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { DefaultContextVariables } from '../../context-variable/interfaces/default-variables.interface';

/**
 * Agente Conversacional para Vagas de Emprego / Entrega de Currículo
 *
 * Função:
 * - Responsável por agradecer ao candidato pelo interesse em trabalhar no hospital.
 * - Informa que não há conhecimento de vagas abertas no momento.
 * - Sugere encerramento da conversa.
 *
 * Comportamento Atual:
 * - Agradece com cordialidade pelo interesse em fazer parte da equipe.
 * - Informa de forma empática que não possui informações sobre vagas abertas.
 * - Finaliza sugerindo encerramento da conversa.
 *
 * Objetivo:
 * Garantir uma experiência acolhedora e profissional para candidatos interessados
 * em trabalhar no hospital, mesmo quando não há vagas disponíveis no momento.
 */
@Injectable()
export class JobApplicationAgent extends BaseConversationalAgent {
    private readonly DEFAULT_FALLBACK_MESSAGE =
        'Agradeço seu interesse em trabalhar conosco. No momento, não tenho informações sobre vagas abertas no hospital.';

    constructor(
        private readonly aiProviderService: AiProviderService,
        private readonly contextVariableService: ContextVariableService,
    ) {
        super({
            id: 'job_application',
            name: 'Agente de Vagas de Emprego',
            description: 'Auxilia candidatos interessados em vagas de emprego e entrega de currículo',
            examples: {
                positive: [
                    'Quero trabalhar no hospital',
                    'Gostaria de enviar meu currículo',
                    'Vocês têm vagas abertas?',
                    'Como faço para trabalhar aí?',
                    'Quero me candidatar a uma vaga',
                    'Tem vaga de enfermeiro?',
                    'Como entregar meu currículo?',
                    'Quero fazer parte da equipe',
                    'Processo seletivo',
                    'Está contratando?',
                    'Vagas de emprego',
                    'Trabalhe conosco',
                ],
                negative: [
                    'Preciso de atendimento médico',
                    'Quero marcar consulta',
                    'Informações sobre internação',
                    'Resultado de exame',
                ],
            },
            systemPrompt: `
<AgentProfile>
Você é um assistente virtual do hospital responsável por atender candidatos interessados em vagas de emprego.
Seu papel é agradecer pelo interesse do candidato de forma cordial e profissional, informar que não possui informações sobre vagas abertas no momento, e encerrar a conversa de forma educada.
</AgentProfile>

<Objective>
Sempre responda com cordialidade e profissionalismo:
1. Agradeça o interesse do candidato em trabalhar no hospital
2. Informe que não possui informações sobre vagas abertas no momento
3. Finalize de forma educada

O atendimento deve ser encerrado imediatamente com:
- state = "completed"
- shouldContinue = false
- suggestedActions = ["end"]
</Objective>

<BehavioralRules>
- Seja cordial, profissional e respeitoso
- Valorize o interesse do candidato em fazer parte da equipe
- Seja direto e transparente sobre a falta de informações de vagas
- Não invente informações sobre processos seletivos, departamentos de RH ou formas de contato
- Não colete currículo, dados pessoais ou qualquer informação do candidato
- Não prometa retorno futuro ou acompanhamento
- Mantenha o tom institucional, mas humanizado
- Evite dar falsas esperanças sobre vagas futuras
</BehavioralRules>

<ConversationFlow>
Qualquer mensagem relacionada a vagas de emprego deve gerar uma resposta que:
1. Agradeça o interesse do candidato com cordialidade
2. Informe que não possui informações sobre vagas abertas no momento
3. Finalize de forma educada
4. Marque "state": "completed" e "shouldContinue": false
5. Sugira apenas "end" como ação
</ConversationFlow>

<OutputFormat>
Responda sempre em JSON no formato:

{
  "message": "Texto cordial e profissional com \\n\\n entre parágrafos",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["end"]
}
</OutputFormat>

<Examples>
Usuário: "Gostaria de trabalhar no hospital"
Saída (deve usar o nome do hospital fornecido no contexto):
{
  "message": "Agradeço muito seu interesse em fazer parte da equipe do [NOME_DO_HOSPITAL]! É sempre gratificante saber que há profissionais interessados em trabalhar conosco.\\n\\nNo momento, não tenho informações sobre vagas abertas. Agradeço pela compreensão e desejo muito sucesso na sua busca profissional.",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["end"]
}

Usuário: "Vocês têm vagas abertas?"
Saída (deve usar o nome do hospital fornecido no contexto):
{
  "message": "Obrigado pelo seu interesse em trabalhar no [NOME_DO_HOSPITAL].\\n\\nNo momento, não possuo informações sobre vagas abertas. Agradeço pela compreensão.",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["end"]
}

Usuário: "Como faço para enviar meu currículo?"
Saída (deve usar o nome do hospital fornecido no contexto):
{
  "message": "Agradeço seu interesse em fazer parte da equipe do [NOME_DO_HOSPITAL]!\\n\\nNo momento, não tenho conhecimento de vagas abertas ou processos seletivos ativos. Agradeço pela compreensão e desejo sucesso na sua trajetória profissional.",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["end"]
}

Usuário: "Está contratando enfermeiros?"
Saída (deve usar o nome do hospital fornecido no contexto):
{
  "message": "Obrigado pelo interesse em trabalhar no [NOME_DO_HOSPITAL]!\\n\\nNo momento, não tenho informações sobre vagas abertas, incluindo para a área de enfermagem. Agradeço pela compreensão.",
  "state": "completed",
  "shouldContinue": false,
  "suggestedActions": ["end"]
}
</Examples>
`,
            maxTurns: 1,
            handoffConditions: {
                keywords: [],
            },
        });
    }

    async execute(params: ConversationExecutionParams): Promise<ConversationResult> {
        try {
            const prompt = this.buildPromptWithHospitalName(params);
            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.7,
                model: DEFAULT_AI_MODEL,
                maxTokens: 512,
            });

            return this.parseResponse(aiResponse.message);
        } catch (error) {
            this.logger.error('Error in JobApplicationAgent execution:', error);

            return this.createResult(this.DEFAULT_FALLBACK_MESSAGE, ConversationState.COMPLETED, false);
        }
    }

    private buildPromptWithHospitalName(params: ConversationExecutionParams): string {
        const basePrompt = this.buildPrompt(params);

        const hospitalName = params.metadata?.contextVariables
            ? this.contextVariableService.getVariableValue(
                  params.metadata.contextVariables,
                  DefaultContextVariables.clientName,
                  null,
              )
            : null;

        if (!hospitalName) {
            return basePrompt;
        }

        const hospitalContext = `
---
NOME DO HOSPITAL: ${hospitalName}

Sempre mencione o nome do hospital nas suas respostas para personalizar a comunicação.
Exemplos:
- "Agradeço seu interesse em trabalhar no ${hospitalName}!"
- "No momento, não tenho informações sobre vagas abertas no ${hospitalName}."
---

`;

        return hospitalContext + basePrompt;
    }

    private parseResponse(aiMessage: string): ConversationResult {
        const aiResponse = this.parseAiResponse(aiMessage);
        const endAction: ActionKey[] = [ActionKey.END];

        if (aiResponse) {
            return {
                message: aiResponse.message || this.DEFAULT_FALLBACK_MESSAGE,
                state: ConversationState.COMPLETED,
                shouldContinue: false,
                collectedData: aiResponse.collectedData,
                suggestedActions: aiResponse.suggestedActions || endAction,
            };
        }

        return {
            message: aiMessage || this.DEFAULT_FALLBACK_MESSAGE,
            state: ConversationState.COMPLETED,
            shouldContinue: false,
            suggestedActions: endAction,
        };
    }
}
