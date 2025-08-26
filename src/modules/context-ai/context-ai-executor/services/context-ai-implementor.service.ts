import { Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { DoQuestion, DoQuestionParameters } from '../interfaces/do-question.interface';
import { ContextMessageService } from '../../context-message/context-message.service';
import { ListMessagesByContext } from '../../context-message/interfaces/list-messages-by-context.interface';
import { ContextMessage } from '../../context-message/entities/context-message.entity';
import {
    ContextMessageRole,
    ContextMessageType,
    IContextMessage,
} from '../../context-message/interfaces/context-message.interface';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { ExecuteResponse } from '../interfaces/context-execute.interface';
import { ContextFallbackMessageService } from '../../context-fallback-message/context-fallback-message.service';
import { ContextAiBuilderService } from './context-ai-builder.service';
import { ContextAiHistoricService } from './context-ai-historic.service';
import { CreateContextMessage } from '../../context-message/interfaces/create-context-message.interface';
import { AiProviderError } from '../interfaces/ai-provider.interface';
import { AgentService } from '../../agent/services/agent.service';
import { AiProviderService } from '../../ai-provider/ai.service';
import { AiMessage, AIProviderType } from '../../ai-provider/interfaces';
import { AgentType } from '../../agent/entities/agent.entity';
import { AgentMode, IAgent } from '../../agent/interfaces/agent.interface';
import { ContextAiRewriteQuestionService } from './context-ai.rewrite-question.service';
import { IntentDetectionService } from '../../intent-detection/services/intent-detection.service';

@Injectable()
export class ContextAiImplementorService {
    private logger: Logger = new Logger(ContextAiImplementorService.name);

    constructor(
        private readonly aiProviderService: AiProviderService,
        private readonly contextMessageService: ContextMessageService,
        private readonly embeddingsService: EmbeddingsService,
        private readonly contextVariableService: ContextVariableService,
        private readonly contextFallbackMessageService: ContextFallbackMessageService,
        private readonly contextAiBuilderService: ContextAiBuilderService,
        private readonly contextAiHistoricService: ContextAiHistoricService,
        private readonly agentService: AgentService,
        private readonly contextAiRewriteQuestionService: ContextAiRewriteQuestionService,
        private readonly intentDetectionService: IntentDetectionService,
    ) {}

    private async createContextMessageAndCaching(newMessage: CreateContextMessage): Promise<IContextMessage> {
        const message = await this.contextMessageService.create(newMessage);

        if (!newMessage.isFallback) {
            await this.contextAiHistoricService.createContextMessage(message);
        }

        return message;
    }

    public async listMessagesByContext({
        contextId,
    }: ListMessagesByContext): Promise<DefaultResponse<ContextMessage[]>> {
        const result = await this.contextMessageService.listMessagesByContextId(contextId);
        return {
            data: result,
        };
    }

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

    private async getNextPrompt(
        agent: IAgent,
        question: { text: string; embedding: number[] },
        parameters: DoQuestionParameters = {},
    ): Promise<{ prompt: string; context: string; trainingIds: string[] }> {
        const content = await this.embeddingsService.listEmbeddingsByWorkspaceId(agent.workspaceId, question.embedding);

        if (!content?.length && agent.agentMode === AgentMode.RAG_ONLY) {
            return { prompt: null, context: null, trainingIds: [] };
        }

        const context = content
            .map(({ identifier, content }) => `Pergunta: ${identifier}\n Resposta: ${content}`)
            .join('\n---\n');

        const result = await this.contextAiBuilderService.buildMessageTemplate({
            agent,
            question: question.text,
            context,
            parameters,
        });

        return { prompt: result, context: context, trainingIds: content.map((item) => item.id) };
    }

    public async doQuestion(workspaceId: string, data: DoQuestion): Promise<DefaultResponse<ExecuteResponse>> {
        const activeAgents = await this.agentService.existsActiveAgents(workspaceId, AgentType.RAG);

        if (!activeAgents) {
            return {
                data: {
                    errorCode: 'ERR_01',
                    error: true,
                    errorMessage: 'No active agents found.',
                    message: null,
                    variables: [],
                },
            };
        }

        const { contextId, question, fromInteractionId, parameters } = data;
        const defaultResponse: DefaultResponse<ExecuteResponse> = {
            data: {
                message: null,
                variables: [],
            },
            metadata: null,
        };

        // inicialmente trabalhando com um agente fixo, todas as entidades foram preparadas para uma estrutura de múltiplos
        // porém para facilitar os testes e evolução deixado fixo um, e para funcionar no cliente deve ter um agente do tipo isDefault ativo
        const agent = await this.agentService.getDefaultAgent(workspaceId, AgentType.RAG);
        const referenceId: string = v4();

        let newQuestion: string = question;

        const contextVariables = await this.contextVariableService.listVariablesFromAgentResume({
            workspaceId,
            agentId: agent.id,
        });

        const defaultModelName = agent.modelName || 'gpt-4o-mini';
        const defaultProps: CreateContextMessage = {
            fromInteractionId,
            workspaceId,
            referenceId,
            contextId,
            nextStep: null,
            content: null,
            role: null,
            completionTokens: 0,
            promptTokens: 0,
            agentId: agent.id,
            isFallback: false,
            modelName: defaultModelName,
            type: ContextMessageType.message,
        };

        try {
            newQuestion = await this.contextAiRewriteQuestionService.rewriteQuestion({
                agent,
                contextId,
                question,
                referenceId,
            });
        } catch (error) {
            const { isFallback, message } = await this.contextAiBuilderService.handleMessage(
                agent,
                null,
                AiProviderError.InvalidQuestion,
                true,
            );

            const [createdMessage] = await Promise.all([
                this.createContextMessageAndCaching({
                    ...defaultProps,
                    content: message,
                    role: ContextMessageRole.system,
                    isFallback,
                }),
                this.createContextMessageAndCaching({
                    ...defaultProps,
                    content: newQuestion,
                    role: ContextMessageRole.user,
                    isFallback,
                }),
            ]);

            defaultResponse.data.message = createdMessage;
            defaultResponse.data.variables = contextVariables;

            return defaultResponse;
        }

        try {
            const { embedding, tokens } = await this.embeddingsService.getEmbeddingFromText(newQuestion);
            const historicMessages = await this.getHistoryMessages(agent, contextId);

            const { prompt, context, trainingIds } = await this.getNextPrompt(
                agent,
                {
                    text: newQuestion,
                    embedding,
                },
                parameters,
            );

            if (!context) {
                const { message, isFallback } = await this.contextAiBuilderService.handleMessage(
                    agent,
                    null,
                    AiProviderError.ContextNotFound,
                    true,
                );

                const [createdMessage] = await Promise.all([
                    this.createContextMessageAndCaching({
                        ...defaultProps,
                        content: message,
                        role: ContextMessageRole.system,
                        isFallback,
                    }),
                    this.createContextMessageAndCaching({
                        ...defaultProps,
                        content: newQuestion,
                        role: ContextMessageRole.user,
                        isFallback,
                    }),
                ]);

                defaultResponse.data.message = createdMessage;
                defaultResponse.data.variables = contextVariables;

                await this.contextFallbackMessageService.create({
                    question: newQuestion,
                    workspaceId,
                    context,
                    trainingIds,
                    agentId: agent.id,
                });

                return defaultResponse;
            }

            const variables = await this.contextVariableService.listVariablesFromAgent({
                workspaceId,
                agentId: agent.id,
            });
            const temperature = this.contextVariableService.getVariableValue(variables, 'temperature') || 0.3;

            const aiResponse = await this.aiProviderService.execute({
                provider: AIProviderType.openai,
                messages: historicMessages,
                prompt,
                maxTokens: 2056,
                temperature: Number(temperature),
                model: defaultModelName,
                frequencyPenalty: 0.5,
                presencePenalty: 0.3,
            });

            const { message, isFallback, nextStep } = await this.contextAiBuilderService.handleMessage(
                agent,
                aiResponse.message,
            );

            if (!aiResponse) {
                defaultResponse.data.error = true;
                defaultResponse.data.variables = contextVariables;

                await this.contextFallbackMessageService.create({
                    question: newQuestion,
                    workspaceId,
                    context,
                    trainingIds,
                    agentId: agent.id,
                });

                return defaultResponse;
            }

            const { completionTokens, promptTokens } = aiResponse;

            const [createdMessage] = await Promise.all([
                this.createContextMessageAndCaching({
                    ...defaultProps,
                    nextStep,
                    content: message,
                    role: ContextMessageRole.system,
                    completionTokens,
                    promptTokens,
                    isFallback,
                }),
                this.createContextMessageAndCaching({
                    ...defaultProps,
                    content: newQuestion,
                    nextStep: null,
                    role: ContextMessageRole.user,
                    completionTokens: 0,
                    promptTokens: tokens,
                    isFallback,
                }),
            ]);

            if (isFallback) {
                await this.contextFallbackMessageService.create({
                    question: newQuestion,
                    workspaceId,
                    context,
                    trainingIds,
                    agentId: agent.id,
                });
            }

            defaultResponse.data.message = createdMessage;
            defaultResponse.data.variables = contextVariables;

            const { actions, detectedIntent, interaction } = await this.intentDetectionService.getIntentDetectionById(
                nextStep?.intent,
                agent.id,
            );

            defaultResponse.data.intent = {
                actions,
                detectedIntent: detectedIntent || null,
                interaction: interaction || null,
            };

            return defaultResponse;
        } catch (error) {
            this.logger.error('ContextAiHistoricService.doQuestion', error);
        }
    }
}
