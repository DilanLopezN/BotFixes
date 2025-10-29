import { Injectable, Logger } from '@nestjs/common';
import { AiExecuteData } from '../interfaces/ai-execute-data';
import { AiGenerateEmbeddings } from '../interfaces/ai-generate-embeddings';
import Groq from 'groq-sdk';
import { AiExecute, AiMessage, AIProvider } from '../interfaces';
import { ChatCompletionMessageParam } from 'groq-sdk/resources/chat';
import { clientGroq } from '../helpers/groq-ai.instance';

/**
 * vi que tem outras coisas em conta também, implementei para manter o padrão e caso vá usar futuramente em outros serviços
 */
@Injectable()
export class GroqProviderService implements AIProvider {
    private logger = new Logger(GroqProviderService.name);
    private modelName = 'llama-3.1-70b-versatile'; // Modelo padrão para chat
    private transcriptionModelName = 'whisper-large-v3-turbo'; // Modelo para transcrição
    private groq: Groq;

    constructor() {
        this.groq = clientGroq();
    }

    private prepareTextToEmbedding(text: string) {
        return text.trim().toLowerCase();
    }

    /**
     * Groq não suporta embeddings nativamente ainda
     */
    public async generateEmbeddings(text: string): Promise<AiGenerateEmbeddings> {
        throw new Error('Groq não suporta embeddings ainda. Use OpenAI provider para embeddings.');
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

    public async execute({ messages, prompt }: AiExecute): Promise<AiExecuteData> {
        const historicMessages = await this.getHistoryMessages(messages, prompt);

        try {
            const response = await this.groq.chat.completions.create({
                model: this.modelName,
                messages: historicMessages,
                temperature: 0.7,
                max_tokens: 1024,
            });

            const message = response.choices[0]?.message?.content || '';
            const promptTokens = response.usage?.prompt_tokens || 0;
            const completionTokens = response.usage?.completion_tokens || 0;

            return {
                message,
                promptTokens,
                completionTokens,
            };
        } catch (error) {
            this.logger.error('GroqProviderService.execute', error);
            throw error;
        }
    }

    /**
     * Método para transcrição de áudio usando Whisper
     */
    public async transcribeAudio(filePath: string, language: string = 'pt'): Promise<any> {
        try {
            const fs = require('fs');
            const transcription = await this.groq.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: this.transcriptionModelName,
                response_format: 'verbose_json',
                language: language,
                temperature: 0,
            });

            return transcription;
        } catch (error) {
            this.logger.error('GroqProviderService.transcribeAudio', error);
            throw error;
        }
    }

    /**
     * Método sendMessage para compatibilidade com a interface
     */
    public async sendMessage(data: any): Promise<any> {
        try {
            const response = await this.groq.chat.completions.create({
                model: this.modelName,
                messages: [
                    {
                        role: 'user',
                        content: data.message || data.content,
                    },
                ],
                temperature: data.temperature || 0.7,
                max_tokens: data.maxTokens || 1024,
            });

            return {
                response: {
                    choices: response.choices.map((choice) => ({
                        message: {
                            content: choice.message.content,
                            role: choice.message.role,
                        },
                    })),
                },
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
            };
        } catch (error) {
            this.logger.error('GroqProviderService.sendMessage', error);
            throw error;
        }
    }
}
