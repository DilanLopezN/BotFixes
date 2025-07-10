import { Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { DoQuestion } from '../interfaces/do-question.interface';
import { ContextMessageService } from '../../context-message/context-message.service';
import { ListMessagesByContext } from '../../context-message/interfaces/list-messages-by-context.interface';
import { ContextMessage } from '../../context-message/entities/context-message.entity';
import { ContextMessageRole, IContextMessage } from '../../context-message/interfaces/context-message.interface';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { ExecuteResponse } from '../interfaces/context-execute.interface';
import { QuestionFiltersValidatorService } from '../validators/question-filters.service';
import { ContextFallbackMessageService } from '../../context-fallback-message/context-fallback-message.service';
import { ContextAiBuilderService } from './context-ai-builder.service';
import { ContextAiHistoricService } from './context-ai-historic.service';
import { CreateContextMessage } from '../../context-message/interfaces/create-context-message.interface';
import { AiProviderError } from '../interfaces/ai-provider.interface';
import { AgentService } from '../../agent/services/agent.service';
import { AiProviderService } from '../../ai-provider/ai.service';
import { AiMessage, AIProviderType } from '../../ai-provider/interfaces';

@Injectable()
export class ContextAiImplementorService {
    private logger: Logger = new Logger(ContextAiImplementorService.name);

    constructor(
        private readonly aiProviderService: AiProviderService,
        private readonly contextMessageService: ContextMessageService,
        private readonly embeddingsService: EmbeddingsService,
        private readonly contextVariableService: ContextVariableService,
        private readonly questionFiltersValidatorService: QuestionFiltersValidatorService,
        private readonly contextFallbackMessageService: ContextFallbackMessageService,
        private readonly contextAiBuilderService: ContextAiBuilderService,
        private readonly contextAiHistoricService: ContextAiHistoricService,
        private readonly agentService: AgentService,
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

    private async getHistoryMessages(contextId: string, usePreviousMessages: boolean): Promise<AiMessage[]> {
        const previousMessages: IContextMessage[] = [];

        if (usePreviousMessages) {
            const messages = await this.contextAiHistoricService.listContextMessages(contextId);
            previousMessages.push(...(messages || []));
        }

        return [
            ...(previousMessages || [])?.map((message) => ({
                role: message.role,
                content: message.content,
            })),
        ];
    }

    private async getNextPrompt(
        workspaceId: string,
        agentId: string,
        question: { text: string; embedding: number[] },
    ): Promise<{ prompt: string; context: string; trainingIds: string[] }> {
        const content = await this.embeddingsService.listEmbeddingsByWorkspaceId(workspaceId, question.embedding);

        if (!content?.length) {
            return { prompt: null, context: null, trainingIds: [] };
        }

        const context = content.map(({ content }) => `${content}`).join('\n\n');

        const result = await this.contextAiBuilderService.buildMessageTemplate({
            workspaceId,
            agentId,
            question: question.text,
            context,
        });

        return { prompt: result, context: context, trainingIds: content.map((item) => item.id) };
    }

    public async doQuestion(workspaceId: string, data: DoQuestion): Promise<DefaultResponse<ExecuteResponse>> {
        const activeAgents = await this.agentService.existsActiveAgents(workspaceId, data.botId);

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

        const { contextId, question, useHistoricMessages: usePreviousMessages, fromInteractionId, botId } = data;
        const defaultResponse: DefaultResponse<ExecuteResponse> = {
            data: {
                message: null,
                variables: [],
            },
            metadata: null,
        };

        // inicialmente trabalhando com um agente fixo, todas as entidades foram preparadas para uma estrutura de múltiplos
        // porém para facilitar os testes e evolução deixado fixo um, e para funcionar no cliente deve ter um agente do tipo isDefault ativo
        const agent = await this.agentService.getDefaultAgent(workspaceId);
        const referenceId: string = v4();

        let newQuestion: string = question;

        const contextVariables = await this.contextVariableService.listVariablesFromAgentResume({
            workspaceId,
            agentId: agent.id,
        });

        try {
            newQuestion = this.questionFiltersValidatorService.isValidQuestion(question);
        } catch (error) {
            const { isFallback, message } = await this.contextAiBuilderService.handleMessage(
                workspaceId,
                agent.id,
                null,
                AiProviderError.InvalidQuestion,
                true,
            );
            const createdMessage = await this.createContextMessageAndCaching({
                fromInteractionId,
                workspaceId,
                botId,
                referenceId,
                contextId,
                nextStep: null,
                content: message,
                role: ContextMessageRole.system,
                completionTokens: 0,
                promptTokens: 0,
                isFallback,
                agentId: agent.id,
            });

            defaultResponse.data.message = createdMessage;
            defaultResponse.data.variables = contextVariables;

            return defaultResponse;
        }

        try {
            const { embedding, tokens } = await this.embeddingsService.getEmbeddingFromText(newQuestion);
            const historicMessages = await this.getHistoryMessages(contextId, usePreviousMessages);

            const { prompt, context, trainingIds } = await this.getNextPrompt(workspaceId, agent.id, {
                text: newQuestion,
                embedding,
            });

            if (!context) {
                const { message, isFallback } = await this.contextAiBuilderService.handleMessage(
                    workspaceId,
                    agent.id,
                    null,
                    AiProviderError.ContextNotFound,
                    true,
                );

                const createdMessage = await this.createContextMessageAndCaching({
                    fromInteractionId,
                    workspaceId,
                    botId,
                    referenceId,
                    contextId,
                    nextStep: null,
                    content: message,
                    role: ContextMessageRole.system,
                    completionTokens: 0,
                    promptTokens: 0,
                    isFallback,
                    agentId: agent.id,
                });

                defaultResponse.data.message = createdMessage;
                defaultResponse.data.variables = contextVariables;

                await this.contextFallbackMessageService.create({
                    question: newQuestion,
                    workspaceId,
                    context,
                    trainingIds,
                    botId,
                });

                return defaultResponse;
            }

            const aiResponse = await this.aiProviderService.execute({
                provider: AIProviderType.openai,
                messages: historicMessages,
                prompt,
            });

            const { message, isFallback, nextStep } = await this.contextAiBuilderService.handleMessage(
                workspaceId,
                agent.id,
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
                    botId,
                });

                return defaultResponse;
            }

            const { completionTokens, promptTokens } = aiResponse;

            const [createdMessage] = await Promise.all([
                this.createContextMessageAndCaching({
                    fromInteractionId,
                    workspaceId,
                    botId,
                    referenceId,
                    contextId,
                    nextStep,
                    content: message,
                    role: ContextMessageRole.system,
                    completionTokens,
                    promptTokens,
                    isFallback,
                    agentId: agent.id,
                }),
                this.createContextMessageAndCaching({
                    fromInteractionId,
                    workspaceId,
                    botId,
                    referenceId,
                    contextId,
                    content: newQuestion,
                    nextStep: null,
                    role: ContextMessageRole.user,
                    completionTokens: 0,
                    promptTokens: tokens,
                    isFallback,
                    agentId: agent.id,
                }),
            ]);

            if (isFallback) {
                await this.contextFallbackMessageService.create({
                    question: newQuestion,
                    workspaceId,
                    context,
                    trainingIds,
                    botId,
                });
            }

            defaultResponse.data.message = createdMessage;
            defaultResponse.data.variables = contextVariables;

            return defaultResponse;
        } catch (error) {
            this.logger.error('ContextAiHistoricService.doQuestion', error);
        }
    }
}
