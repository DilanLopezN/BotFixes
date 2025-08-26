import { Injectable, Logger } from '@nestjs/common';
import { AiExecuteData } from '../interfaces/ai-execute-data';
import { AiGenerateEmbeddings } from '../interfaces/ai-generate-embeddings';
import OpenAI from 'openai';
import { AiExecute, AiMessage, AIProvider } from '../interfaces';
import { clientOpenAI } from '../helpers/open-ai.instance';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class OpenIaProviderService implements AIProvider {
    private logger = new Logger(OpenIaProviderService.name);
    private modelName = 'gpt-4o-mini';
    private embeddingModelName = 'text-embedding-3-small';
    private openai: OpenAI;

    constructor() {
        this.openai = clientOpenAI();
    }

    private prepareTextToEmbedding(text: string) {
        return text.trim().toLowerCase();
    }

    public async generateEmbeddings(text: string): Promise<AiGenerateEmbeddings> {
        try {
            const response = await this.openai.embeddings.create({
                model: this.embeddingModelName,
                input: this.prepareTextToEmbedding(text),
            });

            return {
                embedding: response.data[0].embedding,
                tokens: response.usage.total_tokens,
            };
        } catch (error) {
            this.logger.error('OpenIaProviderService.getEmbeddingFromText', error);
            throw error;
        }
    }

    private async getHistoryMessages(
        previousMessages: AiMessage[],
        prompt: string,
    ): Promise<ChatCompletionMessageParam[]> {
        const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: prompt }];

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

    public async execute({
        messages,
        prompt,
        model = this.modelName,
        maxTokens = 2056,
        temperature = 0.25,
        frequencyPenalty,
        presencePenalty,
    }: AiExecute): Promise<AiExecuteData> {
        if (!prompt) {
            return null;
        }

        const openAI = clientOpenAI();
        const historicMessages = await this.getHistoryMessages(messages, prompt);

        try {
            const data: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
                model: model,
                messages: historicMessages,
                max_tokens: Number(maxTokens),
                temperature: Number(temperature),
            };

            if (frequencyPenalty) {
                data.frequency_penalty = frequencyPenalty;
            }

            if (presencePenalty) {
                data.presence_penalty = presencePenalty;
            }

            const response = await openAI.chat.completions.create(data, {
                timeout: 10_000,
            });

            let message = response.choices[0].message.content.trim();

            if (message.includes('```')) {
                message = message
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/, '')
                    .replace(/\s*```$/, '')
                    .trim();
            }

            return {
                message,
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
            };
        } catch (error) {
            this.logger.error('Error in OpenAI API call:', error);
        }
    }

    public async sendMessage(messageOptions: {
        message: string;
        prompt: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
        resultsLength?: number;
    }): Promise<any> {
        const openai = clientOpenAI();
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
                max_tokens: messageOptions.maxTokens || null,
                temperature: messageOptions.temperature ?? 0.5,
                n: messageOptions.resultsLength ?? 1,
            });

            return {
                response,
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
            };
        } catch (error) {
            this.logger.error('Error in OpenAI API call:', error);
        }

        return {
            response: null,
            promptTokens: 0,
            completionTokens: 0,
        };
    }
}
