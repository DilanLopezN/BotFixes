import { Injectable } from '@nestjs/common';
import { clientOpenAI } from '../../../ai-provider/helpers/open-ai.instance';
import { ITTSProvider, TTSOptions, TTSResponse } from '../../interfaces/tts-provider.interface';
import { AudioDurationUtil } from '../../utils/audio-duration.util';

@Injectable()
export class OpenAITTSProvider implements ITTSProvider {
    private readonly openAIClient = clientOpenAI();

    async convertTextToAudio(text: string, options?: TTSOptions): Promise<TTSResponse> {
        const startTime = Date.now();

        try {
            const response = await this.openAIClient.audio.speech.create({
                model: options?.model || 'tts-1',
                voice: (options?.voice as any) || 'alloy',
                input: text,
                speed: options?.speed || 1.15,
                response_format: options?.format as any || 'mp3',
            });

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            const cost = this.calculateCost(text, options);
            const durationSeconds = await AudioDurationUtil.extractMp3Duration(audioBuffer);
            const processingTimeMs = Date.now() - startTime;

            return {
                audioBuffer,
                format: options?.format || 'mp3',
                size: audioBuffer.length,
                cost,
                durationSeconds,
                processingTimeMs,
            };
        } catch (error) {
            throw new Error(`Failed to generate audio with OpenAI: ${error.message}`);
        }
    }

    getSupportedVoices(): string[] {
        return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    }

    getSupportedModels(): string[] {
        return ['tts-1', 'tts-1-hd'];
    }

    calculateCost(text: string, options?: TTSOptions): number {
        const characterCount = text.length;
        const model = options?.model || 'tts-1';

        // OpenAI pricing per 1K characters
        const pricePerThousandChars = model === 'tts-1-hd' ? 0.030 : 0.015;

        return (characterCount / 1000) * pricePerThousandChars;
    }

}