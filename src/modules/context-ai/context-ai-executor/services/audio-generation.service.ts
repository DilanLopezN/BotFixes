import { Injectable, Logger } from '@nestjs/common';
import { AudioTtsService } from '../../audio-tts/services/audio-tts.service';
import { IAgent } from '../../agent/interfaces/agent.interface';

export interface AudioGenerationRequest {
    text: string;
    agent: IAgent;
    contextId: string;
    shouldGenerateAudio: boolean;
    fromAudio?: boolean;
}

export interface AudioGenerationResult {
    isAudio: boolean;
    audioUrl?: string;
}

@Injectable()
export class AudioGenerationService {
    private readonly logger = new Logger(AudioGenerationService.name);

    constructor(private readonly audioTTsService: AudioTtsService) {}

    async generateAudioIfNeeded(request: AudioGenerationRequest, debug = false): Promise<AudioGenerationResult> {
        const { text, agent, contextId, shouldGenerateAudio } = request;

        if (!shouldGenerateAudio || !text) {
            return { isAudio: false };
        }

        // Habilita áudio em desenvolvimento
        if (process.env.NODE_ENV === 'local') {
            agent.allowSendAudio = true;
        }

        if (!agent.allowSendAudio && process.env.NODE_ENV !== 'local') {
            return { isAudio: false };
        }

        try {
            if (debug) {
                this.logger.log(`[Audio] Gerando áudio (${text.length} chars)`);
            }

            const audioUrl = await this.audioTTsService.create({
                botId: agent.botId,
                text,
                workspaceId: agent.workspaceId,
                conversationId: contextId,
                memberId: agent.botId,
            });

            return {
                isAudio: !!audioUrl,
                audioUrl,
            };
        } catch (error) {
            this.logger.error('[Audio] Erro ao gerar áudio:', error.message);
            return { isAudio: false };
        }
    }

    shouldProcessorGenerateAudio(processorType: string, fromAudio: boolean): boolean {
        const audioRules: Record<string, boolean> = {
            greeting: true,
            skill: false,
            rag: true,
            rewrite: false,
        };

        if (fromAudio && audioRules[processorType] !== false) {
            return true;
        }

        return audioRules[processorType] || false;
    }
}
