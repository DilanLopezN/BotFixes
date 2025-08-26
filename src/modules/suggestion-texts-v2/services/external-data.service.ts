import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AiProviderService } from '../../context-ai/ai-provider/ai.service';
import { AIProviderType } from '../../context-ai/ai-provider/interfaces';

@Injectable()
export class ExternalDataService {
    private aiProviderService: AiProviderService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.aiProviderService = this.moduleRef.get<AiProviderService>(AiProviderService, {
            strict: false,
        });
    }

    async sendMessageToAi(messageOptions: {
        message: string;
        prompt: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
    }) {
        const MAX_TOKENS_LIMIT = 4096;
        const maxTokens = Math.min(messageOptions.maxTokens ?? messageOptions.message.length * 3, MAX_TOKENS_LIMIT);

        return await this.aiProviderService.sendMessage({
            ...messageOptions,
            provider: AIProviderType.openai,
            maxTokens,
        });
    }
}
