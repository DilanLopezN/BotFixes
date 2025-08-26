import { Injectable } from '@nestjs/common';
import { QuestionFiltersValidatorService } from '../validators/question-filters.service';
import {
    ContextMessageRole,
    ContextMessageType,
    IContextMessage,
} from '../../context-message/interfaces/context-message.interface';
import { ContextAiHistoricService } from './context-ai-historic.service';
import { AiMessage, AIProviderType } from '../../ai-provider/interfaces';
import { AiProviderService } from '../../ai-provider/ai.service';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { ContextMessageService } from '../../context-message/context-message.service';
import { CreateContextMessage } from '../../context-message/interfaces/create-context-message.interface';

type RewriteQuestionParams = {
    agent: IAgent;
    contextId: string;
    question: string;
    referenceId: string;
};

@Injectable()
export class ContextAiRewriteQuestionService {
    constructor(
        private readonly questionFiltersValidatorService: QuestionFiltersValidatorService,
        private readonly contextAiHistoricService: ContextAiHistoricService,
        private readonly aiProviderService: AiProviderService,
        private readonly contextVariableService: ContextVariableService,
        private readonly contextMessageService: ContextMessageService,
    ) {}

    private async getHistoryMessages(agent: IAgent, contextId: string): Promise<AiMessage[]> {
        const variables = await this.contextVariableService.listVariablesFromAgent({
            workspaceId: agent.workspaceId,
            agentId: agent.id,
        });

        const historicMessagesLength = this.contextVariableService.getVariableValue(
            variables,
            'historicMessagesLength',
        );
        const previousMessages: IContextMessage[] = await this.contextAiHistoricService.listContextMessages(
            contextId,
            historicMessagesLength,
        );

        return [
            ...(previousMessages || [])?.map((message) => ({
                role: message.role,
                content: message.content,
            })),
        ];
    }

    public async rewriteQuestion({ agent, contextId, question, referenceId }: RewriteQuestionParams): Promise<string> {
        this.questionFiltersValidatorService.isValidQuestion(question);

        const history = await this.getHistoryMessages(agent, contextId);

        if (!history || history.length === 0) {
            return question;
        }

        const rewritePrompt = `
            Você é um assistente de sistema cuja única função é reescrever perguntas de usuários para serem autônomas.

            **Sua Tarefa Principal:**
            Analise o "Histórico da Conversa" e a "Pergunta Atual". Transforme a "Pergunta Atual" em uma versão completa que não dependa do histórico, mas APENAS se ela for um claro acompanhamento (usando pronomes como 'ele', 'dela', 'isso').

            **Regras Essenciais (Siga em Ordem):**

            1.  **REGRA 1 (Pergunta já é completa?):** Se a "Pergunta Atual" já for uma pergunta completa e autônoma (como "Quais os horários da Dra. Laura?" ou "Como agendo um exame de sangue?"), retorne-a EXATAMENTE como está, sem nenhuma alteração.

            2.  **REGRA 2 (Pergunta é um acompanhamento?):** Se a "Pergunta Atual" for curta e usar pronomes ou termos que dependem do histórico (ex: "e o valor dele?", "quanto custa?", "e na sexta?"), use o histórico para resolver a referência e criar uma pergunta completa.

            3.  **REGRA 3 (NÃO ADIVINHE O TÓPICO):** Esta é a regra mais importante. Se a "Pergunta Atual" for genérica (como "como faço para agendar uma consulta?", "quais os convênios?"), e NÃO for um claro acompanhamento da última mensagem, você NUNCA deve injetar um tópico do histórico nela. Apenas retorne a pergunta genérica como está. Assumir o tópico é um erro.

            **Exemplos:**

            ---
            Exemplo 1: Acompanhamento correto
            Histórico da Conversa: "Usuário: Queria saber sobre o Dr. Mauricio. | Bot: Ele é ginecologista."
            Pergunta Atual: "e qual o valor?"
            Pergunta Reescrita: "Qual o valor da consulta com o Dr. Mauricio?"
            ---
            Exemplo 2: Troca de contexto correta (Regra 1)
            Histórico da Conversa: "Usuário: Queria saber sobre o Dr. Mauricio."
            Pergunta Atual: "e a doutora laura, atende quando?"
            Pergunta Reescrita: "e a doutora laura, atende quando?"
            ---
            Exemplo 3: Pergunta genérica (Seu caso de erro - Regra 3)
            Histórico da Conversa: "Usuário: Queria saber sobre o Dr. Mauricio."
            Pergunta Atual: "como faço para agendar uma consulta?"
            Pergunta Reescrita: "como faço para agendar uma consulta?"
            ---

            ### Pergunta Atual:
            ${question}
        `;

        const modelName = 'gpt-4o-mini';
        const aiResponse = await this.aiProviderService.execute({
            provider: AIProviderType.openai,
            messages: history,
            prompt: rewritePrompt,
            maxTokens: 1024,
            temperature: 0.2,
            model: modelName,
        });

        const rewriteQuestion = aiResponse?.message || question;

        const defaultProps: CreateContextMessage = {
            fromInteractionId: null,
            workspaceId: agent.workspaceId,
            referenceId,
            contextId,
            nextStep: null,
            content: null,
            role: null,
            completionTokens: aiResponse.completionTokens || 0,
            promptTokens: aiResponse.promptTokens || 0,
            agentId: agent.id,
            isFallback: false,
            modelName: modelName,
            type: ContextMessageType.rewrite,
        };

        await this.contextMessageService.bulkCreate([
            {
                ...defaultProps,
                content: question,
                role: ContextMessageRole.user,
            },
            {
                ...defaultProps,
                content: rewriteQuestion,
                role: ContextMessageRole.system,
            },
        ]);

        return rewriteQuestion;
    }
}
