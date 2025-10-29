import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioTts } from '../entities/audio.entity';
import { CreateAudioTts } from '../interfaces/audio-tts.interface';
import { CONTEXT_AI } from '../../ormconfig';
import { TTSOptions } from '../interfaces/tts-provider.interface';
import { ExternalDataService } from './external-data.service';
import { TTSProviderFactory, TTSProviderType } from './providers/tts-provider-factory.service';

@Injectable()
export class AudioTtsService {
    constructor(
        @InjectRepository(AudioTts, CONTEXT_AI)
        private readonly audioTtsRepository: Repository<AudioTts>,
        private readonly ttsProviderFactory: TTSProviderFactory,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async convertTextToAudio(
        text: string,
        options?: TTSOptions,
        provider?: TTSProviderType,
    ): Promise<{ audioBuffer: Buffer; provider: TTSProviderType; format: string }> {
        const result = await this.ttsProviderFactory.convertTextToAudio(text, options, provider);

        return {
            audioBuffer: result.audioBuffer,
            provider,
            format: result.format,
        };
    }

    async create(data: CreateAudioTts, provider?: TTSProviderType): Promise<string> {
        const actualProvider = provider || TTSProviderType.GOOGLE;
        const result = await this.ttsProviderFactory.convertTextToAudio(data.text, undefined, actualProvider);
        const audioBuffer = result.audioBuffer;

        const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
        const fileName = `audio-${hash}.${result.format}`;

        const file = {
            buffer: audioBuffer,
            originalname: fileName,
            mimetype: `audio/${result.format}`,
            encoding: 'binary',
            size: audioBuffer.length,
        };

        const sendAttachmentWithMessage = false;
        const { attachmentLocation, attachmentId } = await this.externalDataService.createAndUpload(
            file,
            data.conversationId,
            data.memberId,
            sendAttachmentWithMessage ? data.text : undefined,
        );

        const audioTts = this.audioTtsRepository.create({
            ...data,
            name: fileName,
            s3Key: `${data.workspaceId}/${data.botId}/${fileName}`,
            cost: result.cost,
            duration: result.durationSeconds,
            processingTimeMs: result.processingTimeMs,
            attachmentId,
            model: actualProvider,
        });

        await this.audioTtsRepository.save(audioTts);
        return attachmentLocation;
    }
}
