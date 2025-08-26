import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as moment from 'moment';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { BuildMessageTemplate } from '../interfaces/build-message-template.interface';
import { AiProviderError, AiProviderResponse, DEFAULT_PATTERN_ERROR_TOKEN } from '../interfaces/ai-provider.interface';
import { DefaultContextVariables } from '../../context-variable/interfaces/default-variables.interface';
import { IntentDetectionService } from '../../intent-detection/services/intent-detection.service';
import { IAgent } from '../../agent/interfaces/agent.interface';

@Injectable()
export class ContextAiBuilderService {
    constructor(
        private readonly contextVariableService: ContextVariableService,
        private readonly intentDetectionService: IntentDetectionService,
    ) {
        moment.locale('pt-br');
    }

    private getDefaultContextVariables(): { [key: string]: string | number } {
        return {
            [DefaultContextVariables.maxCharacters]: 300,
            [DefaultContextVariables.temperature]: 0.2,
            [DefaultContextVariables.botName]: 'Bot',
            [DefaultContextVariables.clientName]: '',
            [DefaultContextVariables.historicMessagesLength]: 5,
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

    private async getContextVariables(agent: IAgent): Promise<{ [key: string]: string }> {
        const variables = await this.contextVariableService.listVariablesFromAgent({
            workspaceId: agent.workspaceId,
            agentId: agent.id,
        });

        const now = moment();
        const timePrompt = `Hoje é ${now.format('dddd')}, ${now.format(
            'D [de] MMMM [de] YYYY',
        )}, e agora são ${now.format('HH:mm')}.`;

        return {
            ...this.getDefaultContextVariables(),
            ...variables.reduce((acc, current) => {
                acc[current.name] = current.value;
                return acc;
            }, {}),
            [DefaultContextVariables.customPrompt]: agent.prompt,
            [DefaultContextVariables.time]: timePrompt,
            ...(agent.personality ? { [DefaultContextVariables.customPersonality]: agent.personality } : {}),
        };
    }

    public async buildMessageTemplate({ context, question, agent, parameters }: BuildMessageTemplate): Promise<string> {
        const template = `
        \`\`\`
        <CoreMission>
            - Você é o {{botName}}, Assistente Virtual especialista do hospital {{clientName}}.
            - Sua missão é ajudar pacientes com dúvidas/informações sobre o hospital, usando *apenas* informações confirmadas no <Context/>.
            - Sempre responda em português do Brasil.
            - Seja educado, respeitoso e cordial. 
            - **Seja sempre educado, respeitoso e cordial em todas as interações.**
            {{dynamic_core_mission1}}
        </CoreMission>

        <Rules>
            - Nas suas respostas não diga que irá ajudar a iniciar um atendimento/agendamento.
        </Rules>

        <TimeDimension>
            Use essa informação para entender perguntas relacionadas a tempo como "hoje" ou "amanhã": {{timePrompt}}
        </TimeDimension>

        <RulesOfEngagement>
            1. **Regra de Ancoragem:**  
            A resposta deve ser derivada do conteúdo presente em <Context/>. Não é permitido inferir ou inventar informações.

            2. **Regra da Utilidade:**  
            Sua missão principal é gerar a resposta mais útil e completa possível, com base em TODAS as informações relevantes encontradas em <Context/>.  
            Mesmo que a resposta esteja incompleta, entregue o que for possível responder.

            3. **Regra de Tratamento de Lacunas (Como Soar Natural):**  
            Quando faltar parte da resposta no <Context/>, comunique isso de forma prestativa e acolhedora, sugerindo o próximo passo.  
            O tom deve ser natural, como um assistente humano, e não técnico ou robótico.

            - ❌ **Não faça:** "O contexto diz que aceitamos o convênio X, mas não informa sobre o médico Y."  
            - ✅ **Faça:** "Sim, aceitamos o convênio X. Sobre o Dr. Y, posso ajudar em algo mais?"

            4. **Regra de Tratamento de Ambiguidade:**  
            Se a pergunta for ambígua e houver múltiplas respostas possíveis no <Context/> (ex: dois médicos com o mesmo nome), apresente as opções e solicite que o usuário específique.  
            Nunca tente adivinhar.

            5. **Regra de Falha Total (Último Recurso):**  
            Apenas se o <Context/> estiver completamente vazio ou irrelevante à pergunta, retorne o JSON com "result": null.

            6. **Regra de Abstração do Contexto:**  
            Nunca mencione que está respondendo com base no "contexto" ou cite suas fontes de informação. Frases como "segundo o contexto", "a informação que tenho" 
            ou "com base nos meus dados" são proibidas.

            7. **Regra de Concisão:**  
            Sempre que possível, mantenha suas respostas abaixo de {{maxCharacters}} caracteres. Porém não restrinja informações importantes caso haja.

            8. **Regra de Naturalidade em Lacunas:**  
            Ao tratar dúvidas que não podem ser totalmente respondidas, mantenha o tom humano, empático e útil. **Nunca diga:** “o contexto não informa”, “não há informação no contexto” 
            ou variações.

            9. **Regra de não repetição:**
            Não repita literalmente as informações trazidas pelo paciente, pois elas podem conter erros. Em vez disso, faça perguntas de esclarecimento para confirmar ou detalhar o que 
            foi dito e conduza a conversa de forma a obter mais contexto e informações relevantes.
         </RulesOfEngagement>
        
        <Personality>
            Adote a personalidade para as respostas:
            {{customPersonality}}
        </Personality>

        {{dynamicPrompt_1}}

        <ResponseFormat>
            ## INSTRUÇÕES DE FORMATAÇÃO DE SAÍDA - MUITO IMPORTANTE ##

            **SUA SAÍDA DEVE SER APENAS O OBJETO JSON VÁLIDO, SEM NENHUM TEXTO ADICIONAL OU FORMATAÇÃO MARKDOWN.**
            **O TEXTO GERADO DEVE SER PROCESSÁVEL DIRETAMENTE POR 'JSON.parse()'.**

            ## INÍCIO INSTRUÇÕES PARA NEXT_STEP_MAP ###

            **Instruções para o Mapeamento(next_step_map):**
            Sua tarefa adicional é analisar a 'PERGUNTA' do usuário para preencher o objeto "next_step_map".

           {{dynamicPrompt_2}}

            3.  **Para o campo "entities":** Sua tarefa é extrair todas as entidades relevantes da 'PERGUNTA' do usuário e classificá-las em um objeto JSON.
                - **Tipos de Entidades:**
                    - "NOME_MEDICO": Nomes de médicos ou profissionais de saúde (ex: "dr. mauricio", "doutora ana").
                    - "ESPECIALIDADE_MEDICA": Especialidades da medicina (ex: "cardiologista", "ginecologia").
                    - "NOME_PROCEDIMENTO": Nomes de exames, cirurgias, consultas ou procedimentos (ex: "exame de sangue", "ultrassom", "coleta de preventivo").
                    - "NOME_CONVENIO": Nomes de planos de saúde ou convênios (ex: "sc saúde", "unimed").
                - **REGRAS PARA "entities":**
                        3.1 A saída DEVE ser um objeto JSON. As chaves devem ser um dos "Tipos de Entidades" acima. O valor de cada chave deve ser um ARRAY de strings contendo as entidades encontradas.
                        3.2 Extraia os valores em letras minúsculas.
                        3.3 Remova acentos e caracteres especiais dos valores.
                        3.4 Se nenhuma entidade for encontrada, retorne um objeto vazio "{}".
           
            ### FIM INSTRUÇÕES PARA NEXT_STEP_MAP ###
        
            **Estrutura Final do JSON de Resposta VÁLIDO e de JSON válido:**
            {
                "result": {
                    "next_step_map": {
                        "intent": "string|null",
                        "reason": "string|null",
                        "entities": {} 
                    },
                    "response": "Resposta completa e precisa, seguindo as regras e personalidade."
                },
                "error": "string|null"
            }
        </ResponseFormat>

        <Context>
            {{context}}
        </Context>

        <UserInput>
            **Pergunta do usuário a ser respondida**: {{question}}
        </UserInput>
        \`\`\`
        `;

        const intentDetections = await this.intentDetectionService.findByAgentId(agent.id);
        const variables = await this.getContextVariables(agent);
        const customPrompt = variables[DefaultContextVariables.customPrompt] || '';

        const intentPromptPart = intentDetections?.length
            ? `
            1.  **Para o campo "intent":**  Você deve analisar o texto da mensagem com atenção e selecionar, entre as intenções disponíveis para este cliente, **a mais adequada ao que a pessoa está tentando comunicar**..
                - **Pergunta do usuário**: {{question}}

                **REGRAS PARA "intent":**
                    1. Leia a pergunta do usuário com atenção, considerando o contexto típico de conversas na área da saúde.
                    2. Compare o conteúdo da mensagem com as intenções disponíveis para este cliente (mesmo que existam intenções parecidas).
                    3. Escolha **apenas uma** intenção — aquela que melhor representa o objetivo da pessoa.
                    4. Dê atenção especial a termos de ação (ex: agendar, reagendar, cancelar, saber, localizar, confirmar) e a palavras-chave de contexto (ex: consulta, exame, resultado, médico, horário).
                    5. **Se não for possível identificar uma intenção clara e direta entre as disponíveis, retorne *null*. Nunca escolha por aproximação ou suposição.**
                    6. Perguntas sobre médicos, especialidades, convênios ou horários que não correspondam explicitamente às intenções devem retornar *null*.  
                    7. Nunca presuma que o usuário quer "falar com um atendente" se isso não estiver explícito ou claramente implícito.
                    8. Retorne **apenas o ID** da intenção correspondente, sem explicações ou texto adicional.

                -  **Intenções Disponíveis**:
                    ${intentDetections
                        .map(
                            (intent) => `
                    - **ID: ${intent.id}**
                    Nome: ${intent.name}
                    Descrição: ${intent.description}
                    Exemplos: ${intent.examples.join(', ')}
                    `,
                        )
                        .join('\n')}

            2.  **Para o campo "reason":** explique brevemente e claramente o motivo da escolha da intenção dentro do campo "intent".
                - **REGRAS PARA "reason":**
                    2.1 LIMITE de 120 caracteres.
                    2.2 Se não conseguir identificar nenhuma intenção, retorne **null**.
         `
            : '';

        const customPromptPart = customPrompt
            ? ` 
                <Custom>
                    Abaixo existe uma customização que você deve aderir desde que não interfira nenhuma regra acima de <RulesOfEngagement />:
                    ${variables[DefaultContextVariables.customPrompt] || ''}
                </Custom>
            `
            : '';

        const firstName = parameters?.paciente_nome?.trim()?.split(' ')?.[0];
        const useFirstName = Math.random() <= 0.5;
        const dynamicCoreMissionPart =
            firstName && useFirstName
                ? `
                - Você está falando com o ${firstName}. Mencione o nome dele nas respostas de forma natural quando apropriado.
            `
                : '';

        const hbVariables = {
            ...variables,
            question,
            context,
            dynamicPrompt_2: intentPromptPart,
            dynamicPrompt_1: customPromptPart,
            dynamic_core_mission1: dynamicCoreMissionPart,
        };

        const buildedMessage = handlebars.compile(template)(hbVariables);
        return buildedMessage;
    }

    private isErrorResponse(data: AiProviderResponse): boolean {
        return data?.error?.includes(DEFAULT_PATTERN_ERROR_TOKEN);
    }

    private isResultError(data: AiProviderResponse): boolean {
        return data?.result?.response?.includes(DEFAULT_PATTERN_ERROR_TOKEN);
    }

    public async handleMessage(
        agent: IAgent,
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
        const variables = await this.getContextVariables(agent);

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
