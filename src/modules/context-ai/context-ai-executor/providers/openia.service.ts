import { Injectable } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources';
import { IContextMessage } from '../../context-message/interfaces/context-message.interface';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { AiExecuteResponse } from '../interfaces/ai-execute.interface';
import { ContextAiBuilderService } from '../services/context-ai-builder.service';
import { clientOpenAI } from '../../helpers/open-ai.instance';
import { ContextAiHistoricService } from '../services/context-ai-historic.service';

@Injectable()
export class OpenIaProviderService {
    private modelName = 'gpt-4o-mini';
    constructor(
        private embeddingsService: EmbeddingsService,
        private readonly contextAiBuilderService: ContextAiBuilderService,
        private readonly contextAiHistoricService: ContextAiHistoricService,
    ) {}

    private async getHistoryMessages(
        workspaceId: string,
        contextId: string,
        usePreviousMessages: boolean,
        question: string,
        context: string,
    ): Promise<ChatCompletionMessageParam[]> {
        const previousMessages: IContextMessage[] = [];

        if (usePreviousMessages) {
            const messages = await this.contextAiHistoricService.listContextMessages(contextId);
            previousMessages.push(...(messages || []));
        }

        const template = await this.contextAiBuilderService.buildMessageTemplate({ workspaceId, question, context });
        const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: template }];

        return [
            ...(previousMessages || [])?.map(
                (message) =>
                    ({
                        role: message.role,
                        content: message.content,
                    } as ChatCompletionMessageParam),
            ),
            ...messages,
        ];
    }

    public async execute(
        workspaceId: string,
        contextId: string,
        usePreviousMessages: boolean,
        question: { text: string; embedding: number[] },
    ): Promise<AiExecuteResponse> {
        const content = await this.embeddingsService.listEmbeddingsByWorkspaceId(workspaceId, question.embedding);

        if (!content?.length) {
            const { message, isFallback } = await this.contextAiBuilderService.handleMessage(workspaceId, null, true);

            return {
                message,
                promptTokens: 0,
                completionTokens: 0,
                isFallback,
            };
        }

        const openAI = clientOpenAI();
        const context = content
            .map(({ identifier, content }) => `Identificador: ${identifier}\n Resposta: ${content}`)
            .join('\n\n');
        const messages = await this.getHistoryMessages(
            workspaceId,
            contextId,
            usePreviousMessages,
            question.text,
            context,
        );

        try {
            const response = await openAI.chat.completions.create(
                {
                    model: this.modelName,
                    messages,
                    max_tokens: 512,
                    temperature: 0.25,
                },
                {
                    timeout: 10_000,
                },
            );

            const { message, isFallback } = await this.contextAiBuilderService.handleMessage(
                workspaceId,
                response.choices[0].message.content.trim(),
            );

            return {
                message,
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                isFallback,
            };
        } catch (error) {
            console.error(error);
        }
    }

    public async sendMessage(messageOptions: {
        message: string;
        prompt: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
        resultsLength?: number;
    }) {
        const openai = clientOpenAI();
        const MAX_TOKENS_LIMIT = 4096;
        const maxTokens = Math.min(messageOptions.maxTokens ?? messageOptions.message.length * 3, MAX_TOKENS_LIMIT);

        const messages = [{ role: 'user', content: messageOptions.message }] as ChatCompletionMessageParam[];

        if (messageOptions.prompt) {
            messages.unshift({
                role: 'system',
                content: messageOptions.prompt,
            });
        }

        try {
            const response = await openai.chat.completions.create({
                model: messageOptions.model ?? this.modelName,
                messages,
                max_tokens: maxTokens,
                temperature: messageOptions.temperature ?? 0.5,
                n: messageOptions.resultsLength ?? 1,
            });

            return {
                response: response,
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
            };
        } catch (error) {
            console.error('Error in OpenAI API call:', error);
        }

        return {
            response: null,
            promptTokens: 0,
            completionTokens: 0,
        };
    }
}
