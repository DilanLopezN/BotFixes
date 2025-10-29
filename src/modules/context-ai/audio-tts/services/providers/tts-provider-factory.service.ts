import { Injectable } from '@nestjs/common';
import { ITTSProvider, TTSOptions, TTSResponse } from '../../interfaces/tts-provider.interface';
import { OpenAITTSProvider } from './openai-tts-provider.service';
import { GoogleTTSProvider } from './google-tts-provider.service';

export enum TTSProviderType {
    OPENAI = 'openai',
    GOOGLE = 'google',
}

@Injectable()
export class TTSProviderFactory {
    private readonly defaultProvider = TTSProviderType.OPENAI;

    constructor(
        private readonly openAIProvider: OpenAITTSProvider,
        private readonly googleProvider: GoogleTTSProvider,
    ) {}

    getProvider(type?: TTSProviderType): ITTSProvider {
        const providerType = type || this.defaultProvider;
        switch (providerType) {
            case TTSProviderType.GOOGLE:
                return this.googleProvider;
            case TTSProviderType.OPENAI:
            default:
                return this.openAIProvider;
        }
    }

    async convertTextToAudio(
        text: string,
        options?: TTSOptions,
        provider?: TTSProviderType
    ): Promise<TTSResponse> {
        const ttsProvider = this.getProvider(provider);
        return await ttsProvider.convertTextToAudio(text, options);
    }

    getSupportedVoices(provider?: TTSProviderType): string[] {
        const ttsProvider = this.getProvider(provider);
        return ttsProvider.getSupportedVoices();
    }

    getSupportedModels(provider?: TTSProviderType): string[] {
        const ttsProvider = this.getProvider(provider);
        return ttsProvider.getSupportedModels();
    }

    calculateCost(text: string, options?: TTSOptions, provider?: TTSProviderType): number {
        const ttsProvider = this.getProvider(provider);
        return ttsProvider.calculateCost(text, options);
    }


    getAvailableProviders(): TTSProviderType[] {
        return Object.values(TTSProviderType);
    }
}