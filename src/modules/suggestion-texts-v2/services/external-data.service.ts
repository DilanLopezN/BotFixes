import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OpenIaProviderService } from '../../context-ai/context-ai-executor/providers/openia.service';

@Injectable()
export class ExternalDataService {
    private openIaProviderService: OpenIaProviderService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.openIaProviderService = this.moduleRef.get<OpenIaProviderService>(OpenIaProviderService, {
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
        return await this.openIaProviderService.sendMessage(messageOptions);
    }
}
