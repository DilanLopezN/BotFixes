import { Injectable, Logger } from '@nestjs/common';
import { AiExecuteData } from '../interfaces/ai-execute-data';
import { AiExecute, AiMessage, AIProvider } from '../interfaces';
import { Content, GenerativeModel } from '@google/generative-ai';
import { clientGoogle } from '../helpers/google-ai.instance';

@Injectable()
export class GoogleIaProviderService implements AIProvider {
    private logger = new Logger(GoogleIaProviderService.name);
    private model: GenerativeModel;

    constructor() {
        this.model = clientGoogle();
    }

    private async getHistoryMessages(previousMessages: AiMessage[]): Promise<Content[]> {
        const messages: Content[] = [];

        return [
            ...(previousMessages || [])?.map(
                (message) =>
                    ({
                        role: message.role === 'system' ? 'model' : message.role,
                        parts: [{ text: message.content }],
                    } as Content),
            ),
            ...messages,
        ];
    }

    public async sendMessage(): Promise<AiExecuteData> {
        return null;
    }

    public async execute({ messages, prompt, image }: AiExecute): Promise<AiExecuteData> {
        try {
            const historicMessages = await this.getHistoryMessages(messages);
            const chatSession = this.model.startChat({
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: 'text/plain',
                },
                history: historicMessages,
            });

            let result;
            if (image) {
                const parts = [
                    prompt,
                    {
                        inlineData: {
                            data: image.data,
                            mimeType: image.mimeType,
                        },
                    },
                ];
                result = await this.model.generateContent(parts);
            } else {
                result = await chatSession.sendMessage(prompt);
            }
            let message = result.response.text();

            if (message.includes('```')) {
                message = message
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/, '')
                    .replace(/\s*```$/, '')
                    .trim();
            }

            return {
                message,
                promptTokens: result.response.usageMetadata.promptTokenCount,
                completionTokens: result.response.usageMetadata.candidatesTokenCount,
            };
        } catch (error) {
            this.logger.error('GoogleIaProviderService.execute', error);
            throw error;
        }
    }
}
