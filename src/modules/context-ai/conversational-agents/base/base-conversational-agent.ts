import { Logger } from '@nestjs/common';
import {
    ConversationalAgent,
    ConversationalAgentConfig,
    ConversationContext,
    ConversationExecutionParams,
    ConversationResult,
    ConversationState,
    ParsedAiResponse,
} from '../interfaces/conversational-agent.interface';

export abstract class BaseConversationalAgent implements ConversationalAgent {
    protected readonly logger: Logger;

    constructor(protected readonly config: ConversationalAgentConfig) {
        this.logger = new Logger(this.constructor.name);
    }

    get id(): string {
        return this.config.id;
    }

    get name(): string {
        return this.config.name;
    }

    get description(): string {
        return this.config.description;
    }

    get examples() {
        return this.config.examples;
    }

    abstract execute(params: ConversationExecutionParams): Promise<ConversationResult>;

    canHandle(_message: string, context?: ConversationContext): boolean {
        if (context && context.agentId === this.id) {
            return true;
        }

        return false;
    }

    buildPrompt(params: ConversationExecutionParams): string {
        const { userMessage, conversationContext } = params;

        let contextInfo = '';
        if (conversationContext) {
            contextInfo = `
## Contexto da Conversa Atual
- Estado: ${conversationContext.state}
- Dados coletados: ${JSON.stringify(conversationContext.collectedData, null, 2)}
- Histórico recente:
${conversationContext.messageHistory
    .slice(-3)
    .map((msg) => `  ${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
    .join('\n')}
`;
        }

        return `
${this.config.systemPrompt}

${contextInfo}

## Nova Mensagem do Usuário
"${userMessage}"

---

**Instruções**:
1. Analise a mensagem do usuário no contexto da conversa
2. Determine o próximo passo apropriado
3. Responda de forma natural e empática
4. Colete informações necessárias de forma progressiva
5. Se não conseguir ajudar, sugira handoff para atendimento humano

Retorne um JSON com:
{
    "message": "Resposta para o usuário",
    "state": "${ConversationState.INITIAL}" | "${ConversationState.COLLECTING_INFO}" | "${ConversationState.PROCESSING}" | "${ConversationState.WAITING_CONFIRMATION}" | "${ConversationState.COMPLETED}" | "${ConversationState.HANDOFF_REQUESTED}",
    "collectedData": { /* dados extraídos */ },
    "shouldContinue": true/false,
    "handoff": { /* opcional, se necessário handoff */ }
}
`;
    }

    protected createResult(
        message: string,
        state: ConversationState,
        shouldContinue: boolean,
        options?: {
            collectedData?: Record<string, any>;
            nextStep?: any;
            suggestedActions?: ConversationResult['suggestedActions'];
        },
    ): ConversationResult {
        return {
            message,
            state,
            shouldContinue,
            collectedData: options?.collectedData,
            nextStep: options?.nextStep,
            suggestedActions: options?.suggestedActions,
        };
    }

    protected shouldHandoff(message: string, context?: ConversationContext): boolean {
        const { handoffConditions } = this.config;

        if (!handoffConditions) {
            return false;
        }

        if (handoffConditions.keywords) {
            const messageLower = message.toLowerCase();
            const hasHandoffKeyword = handoffConditions.keywords.some((keyword) =>
                messageLower.includes(keyword.toLowerCase()),
            );
            if (hasHandoffKeyword) {
                return true;
            }
        }

        if (handoffConditions.states && context) {
            return handoffConditions.states.includes(context.state);
        }

        if (this.config.maxTurns && context) {
            const turns = context.messageHistory.length / 2;
            if (turns >= this.config.maxTurns) {
                this.logger.log(`Max turns (${this.config.maxTurns}) reached for ${this.id}, triggering handoff`);
                return true;
            }
        }

        return false;
    }

    protected createInitialContext(_params: ConversationExecutionParams): ConversationContext {
        return {
            agentId: this.id,
            state: ConversationState.INITIAL,
            collectedData: {},
            messageHistory: [],
            metadata: {
                startedAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString(),
                attempts: 0,
            },
        };
    }

    protected updateContext(
        currentContext: ConversationContext,
        userMessage: string,
        agentResponse: string,
        newData?: Record<string, any>,
        newState?: ConversationState,
    ): ConversationContext {
        return {
            ...currentContext,
            state: newState || currentContext.state,
            collectedData: {
                ...currentContext.collectedData,
                ...newData,
            },
            messageHistory: [
                ...currentContext.messageHistory,
                {
                    role: 'user' as const,
                    content: userMessage,
                    timestamp: new Date().toISOString(),
                },
                {
                    role: 'agent' as const,
                    content: agentResponse,
                    timestamp: new Date().toISOString(),
                },
            ],
            metadata: {
                ...currentContext.metadata,
                lastActivityAt: new Date().toISOString(),
                attempts: (currentContext.metadata?.attempts || 0) + 1,
            },
        };
    }

    protected isValidAiResponse(obj: any): obj is ParsedAiResponse {
        return typeof obj === 'object' && obj !== null && typeof obj.message === 'string';
    }

    protected parseAiResponse(aiMessage: string): ParsedAiResponse | null {
        try {
            const parsed = JSON.parse(aiMessage);

            if (!this.isValidAiResponse(parsed)) {
                this.logger.warn('AI response does not match expected structure:', parsed);
                return null;
            }

            return parsed;
        } catch (error) {
            this.logger.error('Error parsing AI response:', error);
            return null;
        }
    }
}
