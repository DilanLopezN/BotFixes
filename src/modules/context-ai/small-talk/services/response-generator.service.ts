import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../../ai-provider/ai.service';
import { AiModel } from '../../context-ai-executor/enums/ai-models.enum';
import { IntentType } from '../enums/intent-type.enum';
import { ResponseContext } from '../interfaces/response-context.interface';
import { FALLBACK_TEMPLATES } from '../configs/fallback-templates.config';
import { ResponsePromptBuilder } from '../builders/response-prompt.builder';

@Injectable()
export class ResponseGeneratorService {
    private readonly logger = new Logger(ResponseGeneratorService.name);

    constructor(
        private readonly aiProviderService: AiProviderService,
        private readonly responsePromptBuilder: ResponsePromptBuilder,
    ) {}

    async generateResponse(
        intentType: IntentType,
        userMessage: string,
        context: ResponseContext,
    ): Promise<string> {
        try {
            if (intentType === IntentType.EMOJI) {
                return this.getRandomEmojiResponse();
            }

            const llmResponse = await this.generateLLMResponse(intentType, userMessage, context);

            return llmResponse || this.getFallbackResponse(intentType, context);
        } catch (error) {
            this.logger.error('Erro ao gerar resposta:', error);
            return this.getFallbackResponse(intentType, this.getDefaultContext());
        }
    }

    private async generateLLMResponse(
        intentType: IntentType,
        userMessage: string,
        context: ResponseContext,
    ): Promise<string | null> {
        const prompt = this.responsePromptBuilder.build(intentType, userMessage, context);

        const aiResponse = await this.aiProviderService.execute({
            prompt,
            temperature: 0.7,
            model: AiModel.GPT_4_1_NANO,
            maxTokens: 150,
        });

        const response = aiResponse.message?.trim();
        return response && response.length > 10 ? response : null;
    }

    private getRandomEmojiResponse(): string {
        const responses = [
            '😊 Estou à disposição caso precise de algo!',
            '💬 Estou aqui para apoiar no que precisar.',
            '🙂 Obrigado pela mensagem, posso auxiliar em algo específico?',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    private getFallbackResponse(intentType: IntentType, context: ResponseContext): string {
        const template = FALLBACK_TEMPLATES[intentType] || FALLBACK_TEMPLATES[IntentType.GREETING];

        return template({
            botName: context.botName || 'assistente virtual',
            clientName: context.clientName || 'hospital',
            patientName: context.patientName,
        });
    }

    private getDefaultContext(): ResponseContext {
        return {
            botName: 'assistente',
            clientName: 'hospital',
            patientName: '',
        };
    }
}
