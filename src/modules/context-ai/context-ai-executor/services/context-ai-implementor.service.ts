import { Injectable, Logger } from '@nestjs/common';
import { OpenIaProviderService } from '../providers/openia.service';
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

@Injectable()
export class ContextAiImplementorService {
    private logger: Logger = new Logger(ContextAiImplementorService.name);

    constructor(
        private readonly openIaProviderService: OpenIaProviderService,
        private readonly contextMessageService: ContextMessageService,
        private readonly embeddingsService: EmbeddingsService,
        private readonly contextVariableService: ContextVariableService,
        private readonly questionFiltersValidatorService: QuestionFiltersValidatorService,
        private readonly contextFallbackMessageService: ContextFallbackMessageService,
        private readonly contextAiBuilderService: ContextAiBuilderService,
        private readonly contextAiHistoricService: ContextAiHistoricService,
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

    public async doQuestion(
        workspaceId: string,
        { contextId, question, useHistoricMessages: usePreviousMessages, fromInteractionId, botId }: DoQuestion,
    ): Promise<DefaultResponse<ExecuteResponse>> {
        const referenceId: string = v4();
        const defaultResponse: DefaultResponse<ExecuteResponse> = {
            data: {
                message: null,
                variables: [],
            },
            metadata: null,
        };

        let newQuestion: string = question;

        try {
            newQuestion = this.questionFiltersValidatorService.isValidQuestion(question);
        } catch (error) {
            const { isFallback, message } = await this.contextAiBuilderService.handleMessage(workspaceId, 'ERR_02');
            const createdMessage = await this.createContextMessageAndCaching({
                fromInteractionId,
                workspaceId,
                botId,
                referenceId,
                contextId,
                content: message,
                role: ContextMessageRole.system,
                completionTokens: 0,
                promptTokens: 0,
                isFallback,
            });

            defaultResponse.data.message = createdMessage;
            defaultResponse.data.variables = [];

            return defaultResponse;
        }

        const { embedding, tokens } = await this.embeddingsService.getEmbeddingFromText(newQuestion);

        try {
            const response = await this.openIaProviderService.execute(workspaceId, contextId, usePreviousMessages, {
                text: newQuestion,
                embedding,
            });

            if (!response) {
                const contextVariables = await this.contextVariableService.listVariablesFromWorkspaceResume({
                    workspaceId,
                });

                defaultResponse.data.error = true;
                defaultResponse.data.variables = contextVariables;
                return defaultResponse;
            }

            const { completionTokens, promptTokens, message, isFallback } = response;

            const [createdMessage, contextVariables] = await Promise.all([
                this.createContextMessageAndCaching({
                    fromInteractionId,
                    workspaceId,
                    botId,
                    referenceId,
                    contextId,
                    content: message,
                    role: ContextMessageRole.system,
                    completionTokens,
                    promptTokens,
                    isFallback,
                }),
                this.contextVariableService.listVariablesFromWorkspaceResume({
                    workspaceId,
                }),
                this.createContextMessageAndCaching({
                    fromInteractionId,
                    workspaceId,
                    botId,
                    referenceId,
                    contextId,
                    content: newQuestion,
                    role: ContextMessageRole.user,
                    completionTokens: 0,
                    promptTokens: tokens,
                    isFallback,
                }),
            ]);

            if (isFallback) {
                this.contextFallbackMessageService
                    .create({
                        question: newQuestion,
                        workspaceId,
                        botId,
                    })
                    .then();
            }

            defaultResponse.data.message = createdMessage;
            defaultResponse.data.variables = contextVariables;

            return defaultResponse;
        } catch (error) {
            this.logger.error('ContextAiHistoricService.doQuestion', error);
        }
    }
}
