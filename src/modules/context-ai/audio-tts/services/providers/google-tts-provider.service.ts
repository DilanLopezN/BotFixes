import { Injectable } from '@nestjs/common';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { ITTSProvider, TTSOptions, TTSResponse } from '../../interfaces/tts-provider.interface';
import { AudioDurationUtil } from '../../utils/audio-duration.util';

@Injectable()
export class GoogleTTSProvider implements ITTSProvider {
    private readonly client: TextToSpeechClient;
    private readonly apiKey = process.env.GEMINI_API_KEY;

    constructor() {
        this.client = new TextToSpeechClient({
            apiKey: this.apiKey,
        });
    }

    async convertTextToAudio(text: string, options?: TTSOptions): Promise<TTSResponse> {
        if (!this.apiKey) {
            throw new Error('Google API key is required');
        }

        const startTime = Date.now();

        try {
            const audioEncodingString = options?.format?.toUpperCase() || 'OGG_OPUS';
            let audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding;

            switch (audioEncodingString) {
                case 'MP3':
                    audioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.MP3;
                    break;
                case 'OGG_OPUS':
                    audioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.OGG_OPUS;
                    break;
                case 'LINEAR16':
                    audioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.LINEAR16;
                    break;
                default:
                    audioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.OGG_OPUS;
            }

            const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
                input: { text },
                voice: {
                    languageCode: 'pt-BR',
                    name: options?.voice || 'pt-BR-Wavenet-D',
                },
                audioConfig: {
                    audioEncoding: audioEncoding,
                    speakingRate: options?.speed || 1.1,
                },
            };

            const [response] = await this.client.synthesizeSpeech(request);

            if (!response.audioContent) {
                throw new Error('No audio content in response');
            }

            let audioBuffer: Buffer;
            if (typeof response.audioContent === 'string') {
                audioBuffer = Buffer.from(response.audioContent, 'base64');
            } else if (response.audioContent instanceof Uint8Array) {
                audioBuffer = Buffer.from(response.audioContent);
            } else {
                audioBuffer = response.audioContent as Buffer;
            }

            const cost = this.calculateCost(text, options);
            const durationSeconds = await AudioDurationUtil.extractMp3Duration(audioBuffer);
            const processingTimeMs = Date.now() - startTime;

            const format = audioEncodingString === 'OGG_OPUS' ? 'ogg' : options?.format || 'mp3';

            return {
                audioBuffer,
                format,
                size: audioBuffer.length,
                cost,
                durationSeconds,
                processingTimeMs,
            };
        } catch (error) {
            throw new Error(
                `Failed to generate audio with Google TTS: ${error.message}`,
            );
        }
    }

    getSupportedVoices(): string[] {
        return [
            'pt-BR-Chirp3-HD-Achernar',
            'pt-BR-Standard-A',
            'pt-BR-Standard-B',
            'pt-BR-Standard-C',
            'pt-BR-Neural2-A',
            'pt-BR-Neural2-B',
            'pt-BR-Neural2-C',
        ];
    }

    getSupportedModels(): string[] {
        return ['standard', 'neural2', 'chirp3-hd'];
    }

    calculateCost(text: string, options?: TTSOptions): number {
        const characterCount = text.length;
        const voice = options?.voice || 'pt-BR-Chirp3-HD-Achernar';

        // Google Cloud TTS pricing per 1M characters
        let pricePerMillionChars = 16.0; // Standard voices

        if (voice.includes('Neural2')) {
            pricePerMillionChars = 16.0; // WaveNet/Neural2 voices
        } else if (voice.includes('Chirp3-HD')) {
            pricePerMillionChars = 160.0; // Journey/Chirp3-HD voices
        }

        return (characterCount / 1_000_000) * pricePerMillionChars;
    }
}
