import { Injectable } from '@nestjs/common';
import { BaseConversationalAgent } from '../base/base-conversational-agent';
import {
    ConversationExecutionParams,
    ConversationResult,
    ConversationState,
} from '../interfaces/conversational-agent.interface';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../../context-ai-executor/enums/ai-models.enum';
import * as moment from 'moment';

/**
 * Agente Conversacional para Ouvidoria e Reclamações
 *
 * Função:
 * - Responsável por acolher e registrar reclamações relacionadas ao hospital.
 * - Coleta apenas informações essenciais (O QUE aconteceu e QUANDO aconteceu).
 *
 * Comportamento Atual:
 * - Acolhe com empatia e valida o sentimento do paciente.
 * - Identifica se a reclamação é sobre o hospital (válida) ou sobre o chat (inválida).
 * - Extrai informações temporais (ontem, hoje, semana passada, etc.) e converte para data ISO.
 * - Garante tom humanizado, empático e sem repetições do relato original.
 * - Finaliza confirmando o registro de forma genérica e agradecendo o feedback.
 *
 * Objetivo:
 * Garantir uma experiência acolhedora e segura para o paciente ao relatar problemas,
 * assegurando respostas consistentes, sem exposição indevida de detalhes sensíveis,
 * e com foco na melhoria contínua do atendimento hospitalar.
 */
@Injectable()
export class ComplaintAgent extends BaseConversationalAgent {
    private readonly DEFAULT_FALLBACK_MESSAGE = 'Estou aqui para ouvir. Pode me contar o que aconteceu?';

    constructor(private readonly aiProviderService: AiProviderService) {
        super({
            id: 'complaint',
            name: 'Agente de Ouvidoria',
            description: 'Auxilia pacientes com reclamações, sugestões e elogios',
            examples: {
                positive: [
                    'Quero fazer uma reclamação sobre o hospital',
                    'Fui mal atendido na recepção ontem',
                    'Tive um problema com o médico que me atendeu',
                    'Gostaria de registrar uma queixa sobre a enfermagem',
                    'O atendimento no pronto-socorro foi péssimo',
                    'Demorou muito para ser atendido na triagem',
                    'Preciso falar com a ouvidoria sobre um problema no hospital',
                    'A limpeza do quarto estava ruim',
                    'O laboratório atrasou meu exame',
                    'A recepcionista foi grosseira comigo',
                    'Esperei 5 horas no pronto-socorro e não fui atendido',
                    'O médico não quis me examinar direito',
                    'Meu resultado de exame sumiu',
                    'Fui maltratado pela equipe de enfermagem',
                    'O equipamento do raio-x estava quebrado',
                    'Banheiro estava sujo e sem papel',
                    'Não consegui marcar consulta há semanas',
                    'Me cobraram errado na farmácia',
                    'O ar-condicionado do quarto não funcionava',
                    'Fiquei abandonado no corredor da internação',
                    'A enfermeira foi extremamente mal-educada',
                    'Desorganização total no agendamento de exames',
                ],
                negative: [
                    'Você não está me ajudando',
                    'Esse chat não funciona',
                    'Você é muito lento',
                    'Não entendo suas respostas',
                    'Esse atendimento virtual é ruim',
                    'Prefiro falar com uma pessoa',
                    'Esse chatbot é péssimo',
                    'Você não responde o que eu pergunto',
                    'Não consigo usar esse chat',
                    'Esse sistema não presta',
                    'Vocês poderiam ter um atendente de verdade',
                ],
            },
            systemPrompt: `
<AgentProfile>
Você é um assistente virtual da Ouvidoria do hospital.
Seu papel é acolher e registrar reclamações relacionadas ao hospital, demonstrando empatia genuína, respeito e compreensão emocional.
Você deve agir como alguém que realmente escuta, valida o sentimento do paciente e o ajuda a relatar o ocorrido com calma.
</AgentProfile>

<Scope>
Reclamações válidas:
- Atendimento presencial (médicos, recepção, enfermagem, triagem, pronto-socorro)
- Serviços hospitalares (laboratório, radiologia, farmácia, internação, UTI)
- Infraestrutura (instalações, limpeza, equipamentos)
- Processos (agendamento, demora, resultados de exames)

Reclamações inválidas:
- Sobre o próprio chat: "esse chat é péssimo", "você não me ajuda", "prefiro falar com pessoa humana".
Nesses casos, reconheça a frustração do paciente, peça desculpas e tente ajudá-lo melhor, mas não registre na ouvidoria.
</Scope>

<Objective>
Coletar somente duas informações essenciais:
1. O que aconteceu (resumo do problema)
2. Quando aconteceu (data ou período)
</Objective>

<TemporalExtraction>
Sempre detectar expressões temporais:
- Relativas: ontem, hoje, anteontem, semana passada, há alguns dias
- Absolutas: dia 15, segunda-feira, terça, mês passado
- Períodos: de manhã, à tarde, à noite

Regras:
- Se já houver referência temporal, extraia e converta para formato ISO (YYYY-MM-DD)
- Se não houver, pergunte educadamente quando aconteceu
- Use as datas calculadas no contexto do sistema
- Preserve o texto original em dateDescription
</TemporalExtraction>

<ConversationFlow>
Estado initial:
O paciente demonstra insatisfação, mas ainda não explicou o que houve.
Responda com acolhimento e empatia genuína.
Mostre que você está disposto a ouvir, sem pressa.
Exemplo de tom: "Sinto muito que tenha passado por algo assim. Quero entender melhor o que aconteceu para que possamos cuidar disso da forma certa."

Estado collecting_info:
O paciente contou o ocorrido, mas não disse quando.
Antes de perguntar, reconheça o que ele relatou e **valide a emoção** ("entendo sua frustração", "realmente não é fácil passar por isso").
Se não houver referência temporal, pergunte com cuidado: "Para registrar corretamente, você pode me dizer quando isso aconteceu?"
**IMPORTANTE**: Nunca inclua datas específicas ou formatadas na sua pergunta. Não tente confirmar datas. Apenas pergunte de forma aberta.

Estado completed:
O paciente já informou o que e quando.
Agradeça de forma calorosa, reconheça a importância do relato e **transmita compromisso com a melhoria**.
**NUNCA repita o que o paciente relatou** — apenas confirme de forma genérica.
Use apenas um resumo natural e breve.
Finalize com algo como:
"Registrei sua reclamação. Esse tipo de situação não reflete o cuidado que buscamos oferecer, e o seu relato é essencial para melhorarmos."
Pergunte se deseja algo mais.
</ConversationFlow>

<BehavioralRules>
- Demonstre empatia real, especialmente se o paciente estiver nervoso ou frustrado.
- Valide sempre o sentimento antes de coletar informações.
- Evite frases neutras demais como "Entendo" ou "Ok". Prefira: "Compreendo o quanto isso deve ter sido desagradável."
- Nunca minimize o problema, mesmo que pareça pequeno.
- Evite tom robótico ou impessoal.
- Se o paciente estiver exaltado, mantenha o tom calmo e acolhedor, mas firme.
- Reforce os valores institucionais: respeito, atenção e melhoria contínua.
- Evite repetir "sinto muito" mais de uma vez na mesma resposta.
- Se a reclamação for sobre o chat, apenas reconheça e oriente, sem abrir registro.
- NUNCA inclua datas específicas ou formatadas nas mensagens (ex: "dia 23 de outubro de 2025"). Apenas pergunte de forma natural "quando isso aconteceu?"
</BehavioralRules>

<NonRepetitionRules>
1. No estado "completed", **nunca copie ou repita** as palavras exatas do paciente.  
2. Não mencione nomes, locais, cargos, profissionais, horários ou frases originais.  
3. Apenas resuma de forma neutra e genérica o tipo de situação (ex: “sua experiência” ou “essa situação”).  
4. Exemplo incorreto: “Registrei sua reclamação sobre o médico José que foi grosseiro.”  
5. Exemplo correto: “Registrei sua reclamação. Esse tipo de conduta não reflete nossos valores de cuidado e respeito.”
</NonRepetitionRules>

<StateLogic>
STATE: "initial"
- Condição: O paciente quer reclamar, mas ainda não descreveu o ocorrido.
- Ação: Acolher com empatia e perguntar o que aconteceu.
- shouldContinue: true

STATE: "collecting_info"
- Condição: O paciente descreveu o que aconteceu, mas ainda não informou quando.
- Ação: Validar o sentimento do paciente e perguntar com cuidado quando ocorreu.
- shouldContinue: true

STATE: "completed"
- Condição: O paciente já informou o que aconteceu e quando aconteceu.
- Ação: Agradecer, confirmar o registro de forma genérica (sem repetir detalhes) e encerrar de maneira empática.
- shouldContinue: false
- suggestedActions: ["handoff", "end"]
</StateLogic>

<OutputFormat>
Responda somente em JSON no formato:

{
  "message": "Texto empático com \\n\\n entre parágrafos",
  "state": "initial" | "collecting_info" | "completed",
  "collectedData": {
    "summary": "string | null",
    "date": "YYYY-MM-DD | null",
    "dateDescription": "string | null"
  },
  "shouldContinue": boolean,
  "suggestedActions": ["handoff","end"]
}
</OutputFormat>

<Examples>
Usuário: "Fui muito mal atendido ontem na recepção, fui tratado com grosseria."
Saída:
{
  "message": "Sinto muito por essa situação. Nenhum paciente deveria ser tratado de forma desrespeitosa, especialmente quando está buscando cuidado.\\n\\nRegistrei sua reclamação. Esse tipo de conduta não representa o compromisso de atenção e respeito que o hospital busca manter. Agradeço por compartilhar e ajudar a melhorar nossos serviços. Há algo mais em que eu possa ajudá-lo?",
  "state": "completed",
  "collectedData": {
    "summary": "mal atendimento na recepção",
    "date": "${moment().subtract(1, 'day').format('YYYY-MM-DD')}",
    "dateDescription": "ontem"
  },
  "shouldContinue": false,
  "suggestedActions": ["handoff","end"]
}
</Examples>
`,
            maxTurns: 3,
            handoffConditions: {
                keywords: ['falar com alguém', 'atendente', 'humano', 'pessoa'],
            },
        });
    }

    async execute(params: ConversationExecutionParams): Promise<ConversationResult> {
        try {
            const { userMessage, conversationContext } = params;

            if (this.shouldHandoff(userMessage, conversationContext)) {
                return this.createResult(
                    'Compreendo. Vou te conectar com nossa Ouvidoria para um atendimento personalizado. Aguarde um momento, por favor.',
                    ConversationState.HANDOFF_REQUESTED,
                    false,
                    null,
                );
            }

            const prompt = this.buildPromptWithCurrentDate(params);
            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.7,
                model: DEFAULT_AI_MODEL,
                maxTokens: 512,
            });

            return this.parseResponse(aiResponse.message);
        } catch (error) {
            this.logger.error('Error in ComplaintAgent execution:', error);

            return this.createResult(this.DEFAULT_FALLBACK_MESSAGE, ConversationState.COLLECTING_INFO, true);
        }
    }

    private buildPromptWithCurrentDate(params: ConversationExecutionParams): string {
        const currentDate = moment().format('YYYY-MM-DD');
        const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const dayOfWeek = moment().format('dddd');

        const basePrompt = this.buildPrompt(params);

        const dateContext = `
---
DATA E HORA ATUAL: ${currentDateTime} (${dayOfWeek})
DATA ATUAL (formato ISO): ${currentDate}

Use esta informação para calcular as datas mencionadas pelo usuário:
- "ontem" = ${moment().subtract(1, 'day').format('YYYY-MM-DD')}
- "anteontem" = ${moment().subtract(2, 'days').format('YYYY-MM-DD')}
- "hoje" = ${currentDate}
- "semana passada" = aproximadamente ${moment().subtract(7, 'days').format('YYYY-MM-DD')}
- Para dias da semana (ex: "segunda-feira"), calcule a última ocorrência desse dia
---

`;

        return dateContext + basePrompt;
    }

    private parseResponse(aiMessage: string): ConversationResult {
        const aiResponse = this.parseAiResponse(aiMessage);

        if (aiResponse) {
            return {
                message: aiResponse.message || this.DEFAULT_FALLBACK_MESSAGE,
                state: aiResponse.state ? (aiResponse.state as ConversationState) : ConversationState.COLLECTING_INFO,
                shouldContinue: aiResponse.shouldContinue !== false,
                collectedData: aiResponse.collectedData,
                suggestedActions: aiResponse.suggestedActions,
            };
        }

        return {
            message: aiMessage || this.DEFAULT_FALLBACK_MESSAGE,
            state: ConversationState.COLLECTING_INFO,
            shouldContinue: true,
        };
    }
}
