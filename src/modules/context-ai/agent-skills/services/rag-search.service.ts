import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../../context-ai-executor/enums/ai-models.enum';

interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

@Injectable()
export class RagSearchService {
    private readonly logger = new Logger(RagSearchService.name);

    constructor(
        private readonly embeddingsService: EmbeddingsService,
        private readonly aiProviderService: AiProviderService,
    ) {}

    async search(
        agent: IAgent,
        options: {
            userMessage: string;
            maxResults?: number;
            similarityThreshold?: number;
        },
    ): Promise<string[]> {
        try {
            const { userMessage, maxResults = 10, similarityThreshold = 0.4 } = options;
            const { embedding } = await this.embeddingsService.getEmbeddingFromText(userMessage);

            const ragResults = await this.embeddingsService.listEmbeddingsByAgentId(
                agent.id,
                agent.workspaceId,
                embedding,
                {
                    maxResults,
                    minSimilarity: similarityThreshold,
                },
            );

            if (!ragResults.length) {
                return [];
            }

            return ragResults.map((result) => result.content);
        } catch (error) {
            this.logger.error('[RAG Search] Error searching RAG:', error);
            return [];
        }
    }

    async searchAndFormat(
        agent: IAgent,
        options: {
            userMessage: string;
            maxResults?: number;
            similarityThreshold?: number;
        },
    ): Promise<string> {
        const texts = await this.search(agent, options);

        if (!texts.length) {
            return '';
        }

        return texts.map((text, index) => `${index + 1}. ${text}`).join('\n\n');
    }

    /**
     * Reescreve a query do usuário usando histórico conversacional para enriquecer o contexto.
     * Usado antes de buscar no RAG para garantir que a busca semântica tenha contexto suficiente.
     */
    async rewriteQueryForRag(
        userMessage: string,
        conversationHistory?: ConversationMessage[],
    ): Promise<string> {
        // Se não tem histórico ou a mensagem já é completa, retorna a mensagem original
        if (!conversationHistory || conversationHistory.length === 0) {
            return userMessage;
        }

        // Se a mensagem parece completa (tem mais de 5 palavras), não precisa reescrever
        const wordCount = userMessage.trim().split(/\s+/).length;
        if (wordCount > 5) {
            return userMessage;
        }

        try {
            const historyText = conversationHistory
                .map((msg) => {
                    const role = msg.role === 'user' ? 'Usuário' : msg.role === 'assistant' ? 'Assistente' : 'Sistema';
                    return `${role}: ${msg.content}`;
                })
                .join('\n');

            const prompt = `
Você é um assistente que reformula perguntas vagas em perguntas completas para busca em banco de dados.

<ConversationHistory>
${historyText}
</ConversationHistory>

<CurrentQuestion>
${userMessage}
</CurrentQuestion>

<Task>
Analise o histórico da conversa e a pergunta atual. Se a pergunta atual é um follow-up que precisa de contexto do histórico para ser compreendida, reescreva-a de forma completa e clara para ser usada em uma busca semântica.

Se a pergunta atual já é clara e autocontida, retorne ela exatamente como está.

IMPORTANTE:
- Seja conciso - apenas adicione o contexto mínimo necessário
- Mantenha o foco da pergunta original
- NÃO adicione informações que não estejam no histórico
- Retorne APENAS a pergunta reformulada, sem explicações
</Task>

<Examples>
Exemplo 1:
ConversationHistory:
  Usuário: o medico pedro costela atende no hospital?
  Assistente: Sim, o Dr. Pedro Costela é oftalmologista...
CurrentQuestion: e a juliana azevedo?
Resposta: a médica juliana azevedo atende no hospital?

Exemplo 2:
ConversationHistory:
  Usuário: quais são os horários de atendimento?
  Assistente: O hospital funciona das 8h às 18h...
CurrentQuestion: e aos sábados?
Resposta: quais são os horários de atendimento aos sábados?

Exemplo 3:
ConversationHistory:
  Usuário: tem cardiologista?
  Assistente: Sim, temos o Dr. João Silva...
CurrentQuestion: quais médicos trabalham na clínica?
Resposta: quais médicos trabalham na clínica?
</Examples>

Pergunta reformulada:`;

            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.2,
                model: DEFAULT_AI_MODEL,
                maxTokens: 100,
            });

            const rewrittenQuery = aiResponse.message?.trim() || userMessage;

            this.logger.log(
                `[RAG Query Rewrite] Original: "${userMessage}" → Rewritten: "${rewrittenQuery}"`,
            );

            return rewrittenQuery;
        } catch (error) {
            this.logger.error('[RAG Query Rewrite] Error rewriting query:', error);
            return userMessage; // Fallback para mensagem original em caso de erro
        }
    }

    /**
     * Busca no RAG com reescrita automática da query baseada no histórico conversacional.
     */
    async searchWithHistoryContext(
        agent: IAgent,
        options: {
            userMessage: string;
            conversationHistory?: ConversationMessage[];
            maxResults?: number;
            similarityThreshold?: number;
        },
    ): Promise<string[]> {
        const { userMessage, conversationHistory, maxResults = 10, similarityThreshold = 0.4 } = options;

        // Reescreve a query com contexto do histórico
        const rewrittenQuery = await this.rewriteQueryForRag(userMessage, conversationHistory);

        // Busca no RAG usando a query reescrita
        return this.search(agent, {
            userMessage: rewrittenQuery,
            maxResults,
            similarityThreshold,
        });
    }
}
