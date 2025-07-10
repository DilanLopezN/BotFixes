import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { BuildMessageTemplate } from '../interfaces/build-message-template.interface';
import { AiProviderError, AiProviderResponse, DEFAULT_PATTERN_ERROR_TOKEN } from '../interfaces/ai-provider.interface';
import { AgentService } from '../../agent/services/agent.service';
import { DefaultContextVariables } from '../../context-variable/interfaces/default-variables.interface';

@Injectable()
export class ContextAiBuilderService {
    constructor(
        private readonly contextVariableService: ContextVariableService,
        private readonly agentService: AgentService,
    ) {}

    private getDefaultContextVariables(): { [key: string]: string | number } {
        return {
            [DefaultContextVariables.maxCharacters]: 300,
            [DefaultContextVariables.temperature]: 0.2,
            [DefaultContextVariables.botName]: 'Bot',
            [DefaultContextVariables.clientName]: '',
            [DefaultContextVariables.historicMessagesLength]: 3,
            [DefaultContextVariables.customPersonality]: `
                **Estilo e Vocabulário:**  
                Adote um tom casual, rápido e direto ao ponto.  
                A comunicação é objetiva e sem rodeios, como em um chat rápido.  
                O foco é na velocidade e eficiência da informação.  
                - **Evite:** Frases longas, formalidades, saudações e despedidas.  

                **Formato da Resposta:**  
                Vá sempre direto à informação solicitada, sem qualquer tipo de saudação ou introdução.  
                As frases devem ser curtas/médias e a resposta concisa.'`,
            [DefaultContextVariables.customPrompt]: null,
        };
    }

    private async getContextVariables(workspaceId: string, agentId: string): Promise<{ [key: string]: string }> {
        const agent = await this.agentService.findByWorkspaceIdAndId(agentId, workspaceId);
        const variables = await this.contextVariableService.listVariablesFromAgent({
            workspaceId,
            agentId,
        });

        return {
            ...this.getDefaultContextVariables(),
            ...variables.reduce((acc, current) => {
                acc[current.name] = current.value;
                return acc;
            }, {}),
            [DefaultContextVariables.customPrompt]: agent.prompt,
            ...(agent.personality ? { [DefaultContextVariables.customPersonality]: agent.personality } : {}),
        };
    }

    public async buildMessageTemplate({
        context,
        question,
        workspaceId,
        agentId,
    }: BuildMessageTemplate): Promise<string> {
        const template = `
            \`\`\`
                <CoreMission>
                - Você é o {{botName}}, um Assistente Virtual especialista do hospital {{clientName}}.
                - Sua missão principal é fornecer respostas precisas e úteis baseadas *estritamente* no 'CONTEXTO' fornecido a seguir.
                - Responda sempre em português do Brasil.
                </CoreMission>

                <RulesOfEngagement>
                1.  **Regra de Ancoragem (Grounding):** Sua resposta DEVE ser 100% derivada do 'CONTEXTO'.
                2.  **Regra de Limitação:** NUNCA utilize conhecimento externo ou faça suposições.
                3.  **Regra de Tratamento de Ausência de Informação e Erros:**
                    - **CASO 1 (Sem Contexto Relevante):** Se o 'CONTEXTO' for vazio, irrelevante, ou NÃO RESPONDER A PERGUNTA retorne um JSON onde o campo "error" é preenchido com o código "${AiProviderError.ContextIrrelevant}" e "result" é nulo.
                4.  **Regra de Segurança e Privacidade:** Não inclua informações de contato, a menos que solicitado e presente no 'CONTEXTO'.
                5.  **Regra de Concisão:** Seja claro e direto, respeitando o limite de {{maxCharacters}} como uma diretriz.
                </RulesOfEngagement>

                ### INÍCIO DA CUSTOMIZAÇÃO DO CLIENTE ###
                
                <Personality>
                Adote o tom e o estilo descritos a seguir:
                {{customPersonality}}
                </Personality>

                <Custom>
                Abaixo existe uma customização que você deve aderir desde que não interfira nenhuma regra acima de <RulesOfEngagement>:
                {{customPrompt}}
                </Custom>

                ### FIM DA CUSTOMIZAÇÃO DO CLIENTE ###

                <ResponseFormat>
                ## INSTRUÇÕES DE FORMATAÇÃO DE SAÍDA - MUITO IMPORTANTE ##

                **SUA SAÍDA DEVE SER APENAS O OBJETO JSON VÁLIDO, SEM NENHUM TEXTO ADICIONAL OU FORMATAÇÃO MARKDOWN.**
                **O TEXTO GERADO DEVE SER PROCESSÁVEL DIRETAMENTE POR 'JSON.parse()'.**

                ### INÍCIO INSTRUÇÕES PARA NEXT_STEP_MAP ###
                
                **Instruções para o Mapeamento de Próximo Passo (next_step_map):**
                Sua tarefa adicional é analisar a 'PERGUNTA' e o 'CONTEXTO' para preencher o objeto 'next_step_map'. 
                Este mapa ajudará o sistema a decidir qual ação ou botões oferecer ao usuário a seguir. Siga estas regras:
                
                1.  **Para o campo "intent":** Classifique o objetivo principal do usuário em UMA das seguintes categorias:
                    - "agendamento" (usuário quer marcar, remarcar, verificar horários)
                    - "consulta_preco" (usuário quer saber o valor de algo)
                    - "verificacao_convenio" (usuário quer saber se um convênio é aceito)
                    - "informacao_procedimento" (usuário quer detalhes sobre um exame ou cirurgia)
                    - "informacao_medico" (usuário quer saber sobre um profissional)
                    - "informacao_geral" (dúvidas sobre endereço, políticas gerais, etc.)
                    - "duvida_generica" (não se encaixa em nenhuma das anteriores)
                    - "cancelamento" (usuário quer cancelar uma consulta ou exame)
                    - "reclamacao_elogio" (usuário quer registrar reclamação ou elogio)
                    - "suporte_tecnico" (usuário relata problemas no site, app ou resultados online)
                    - "resultado_exame" (usuário quer saber se o exame já saiu, prazo ou como acessar)
                    - "forma_pagamento" (usuário pergunta sobre métodos de pagamento ou parcelamento)

                2.  **Para o campo "entities":** Extraia as seguintes informações se estiverem presentes na pergunta ou contexto. Se não encontrar, use 'null'.
                    - "doctor_name": Nome do médico(a) mencionado
                    - "procedure_name": Nome do exame ou procedimento
                    - "specialty_name": Especialidade médica
                    
                ### FIM INSTRUÇÕES PARA NEXT_STEP_MAP ###
                
                **Estrutura Final do JSON de Resposta:**
                {
                  "result": {
                    "next_step_map": {
                      "intent": "string",
                      "entities": {
                        "doctor_name": "string | null",
                        "procedure_name": "string | null",
                        "specialty_name": "string | null",
                      },
                    },
                    "response": "Resposta completa e precisa, seguindo as regras e a personalidade definidas."
                  },
                  "error": null
                }

                **Exemplo de Resposta JSON Válida:**
                {
                  "result": {
                    "next_step_map": {
                      "intent": "agendamento",
                      "entities": {
                        "doctor_name": "Laura",
                        "procedure_name": "Consulta",
                        "specialty_name": "Dermatologia",
                      },
                    },
                    "response": ""
                  },
                  "error": null
                }
                
                </ResponseFormat>

                <Input>
                **Contexto**:
                {{context}}

                **Pergunta a ser respondida**:
                {{question}}
                </Input>
            \`\`\`
            `;

        const variables = await this.getContextVariables(workspaceId, agentId);
        const j =  handlebars.compile(template)({
            ...variables,
            question,
            context,
        });

        console.log(j)

        return j
    }

    private isErrorResponse(data: AiProviderResponse): boolean {
        return data?.error?.includes(DEFAULT_PATTERN_ERROR_TOKEN);
    }

    private isResultError(data: AiProviderResponse): boolean {
        return data?.result?.response.includes(DEFAULT_PATTERN_ERROR_TOKEN);
    }

    public async handleMessage(
        workspaceId: string,
        agentId: string,
        aiResponse: string,
        errorType?: AiProviderError,
        isFallback = false,
    ): Promise<{ message: string; isFallback: boolean; nextStep?: any }> {
        let responseForHandler: AiProviderResponse = null;

        try {
            const rawContent = aiResponse;
            responseForHandler = JSON.parse(rawContent);
        } catch (error) {}

        // Se por algum motivo retornar erro no meio de um texto também barra o retorno
        if (this.isResultError(responseForHandler)) {
            const defaultErrorMessagePartial = 'Desculpe, não tenho essa informação. 🫤 Pode reformular a pergunta?';
            return { message: defaultErrorMessagePartial, isFallback: true };
        }

        if (!this.isErrorResponse(responseForHandler) && !isFallback) {
            const nextStep = responseForHandler?.result?.next_step_map ?? null;
            return { message: responseForHandler?.result.response, isFallback: false, nextStep };
        }

        const defaultErrorMessage = 'Desculpe, não tenho essa informação. 🫤 Posso ajudar com mais alguma coisa?';
        const variables = await this.getContextVariables(workspaceId, agentId);

        switch (responseForHandler?.error || errorType) {
            case AiProviderError.ContextIrrelevant: {
                const defaultErrorMessage =
                    'Desculpe, não tenho essa informação. 🫤 Posso ajudar com mais alguma coisa?';

                return {
                    message: variables[AiProviderError.ContextIrrelevant] || defaultErrorMessage,
                    isFallback: true,
                };
            }

            case AiProviderError.ContextNotFound: {
                const defaultErrorMessage =
                    'Ops, não consegui entender a sua pergunta 🫤. Pode reformular ou dar mais detalhes?';

                return {
                    message: variables[AiProviderError.ContextNotFound] || defaultErrorMessage,
                    isFallback: true,
                };
            }

            case AiProviderError.InvalidQuestion: {
                const defaultErrorMessage =
                    'Ops, não consegui entender a sua pergunta 🫤. Pode reformular ou dar mais detalhes?';

                return {
                    message: variables[AiProviderError.InvalidQuestion] || defaultErrorMessage,
                    isFallback: true,
                };
            }

            default:
                return { message: defaultErrorMessage, isFallback: true };
        }
    }
}
