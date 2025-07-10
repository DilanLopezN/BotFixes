import { Injectable, Logger } from '@nestjs/common';
import { CONTEXT_AI } from '../../ormconfig';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AudioTranscription } from '../models/audio-transcription.entity';
import { clientOpenAI } from '../../ai-provider/helpers/open-ai.instance';
import * as fs from 'fs';
import axios from 'axios';
import { Exceptions } from '../../../auth/exceptions';
import { CreateAudioTranscriptionData } from '../interfaces/audio-transcription.interface';
import { CacheService } from '../../../_core/cache/cache.service';
@Injectable()
export class AudioTranscriptionService {
    private readonly logger = new Logger(AudioTranscriptionService.name);
    constructor(
        @InjectRepository(AudioTranscription, CONTEXT_AI)
        private audioTranscriptionRepository: Repository<AudioTranscription>,
        private cacheService: CacheService,
    ) {}

    private getAudioTrascriptionPrefixCacheKey(workspaceId: string, externalId: string): string {
        return `AUDIO_TRANSCRIPTION:${workspaceId}:${externalId}`;
    }

    private async setAudioTranscriptionCacheKey(workspaceId: string, externalId: string) {
        const client = await this.cacheService.getClient();
        const key = this.getAudioTrascriptionPrefixCacheKey(workspaceId, externalId);
        await client.set(key, JSON.stringify({ transcribing: true }));
        await client.expire(key, 30);
    }

    private async getAudioTranscriptionFromCache(workspaceId: string, externalId: string): Promise<boolean> {
        const client = await this.cacheService.getClient();
        const key = this.getAudioTrascriptionPrefixCacheKey(workspaceId, externalId);
        const data = await client.get(key);
        const result = JSON.parse(data);
        return !!result?.transcribing;
    }

    private async deleteAudioTranscriptionByExternalIdFromCache(
        workspaceId: string,
        externalId: string,
    ): Promise<void> {
        const client = await this.cacheService.getClient();
        const key = this.getAudioTrascriptionPrefixCacheKey(workspaceId, externalId);
        await client.del(key);
    }

    public async createAudioTranscription(data: CreateAudioTranscriptionData): Promise<AudioTranscription> {
        try {
            const { workspaceId, urlFile, createdBy, conversationId, externalId } = data;

            if (!urlFile || !workspaceId || !createdBy) {
                return null;
            }

            const alreadyTranscribing = await this.getAudioTranscriptionFromCache(workspaceId, externalId || urlFile);

            if (alreadyTranscribing) {
                throw Exceptions.TRANSCRIPTION_IS_ALREADY_BEING_DONE;
            }

            const response = await axios({
                url: urlFile,
                method: 'GET',
                responseType: 'stream',
            });
            const contentLength = response.headers['content-length'];
            const fileSizeInBytes = contentLength ? parseInt(contentLength, 10) : 0;

            // @TODO: acho que deveriamos calcular o tempo do áudio
            // 15s gravando no whatsapp só deu 31KB
            const MAX_SIZE = 0.5 * 1024 * 1024; // 0,5 MB
            if (fileSizeInBytes > MAX_SIZE) {
                throw Exceptions.FILE_SIZE_EXCEED_AUDIO_TRANSCRIPTION;
            }

            const mimeType = response.headers['content-type']?.split(';')[0];
            let fileExtension = '';

            switch (mimeType) {
                case 'audio/mpeg':
                    fileExtension = 'mp3';
                    break;
                case 'audio/wav':
                    fileExtension = 'wav';
                    break;
                case 'audio/ogg':
                    fileExtension = 'ogg';
                    break;
                case 'audio/aac':
                    fileExtension = 'aac';
                    break;
                default:
                    throw Exceptions.INVALID_FILE_TYPE_AUDIO_TRANSCRIPTION;
            }
            await this.setAudioTranscriptionCacheKey(workspaceId, externalId || urlFile);

            const tempFilePath = `/tmp/audio-${Date.now()}.${fileExtension}`;
            const writer = fs.createWriteStream(tempFilePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(true));
                writer.on('error', reject);
            });

            const openai = clientOpenAI();
            openai.timeout = 25_000;
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
                response_format: 'verbose_json',
                language: 'pt',
            });

            if (!transcription?.text || !transcription['duration']) {
                await this.deleteAudioTranscriptionByExternalIdFromCache(workspaceId, externalId || urlFile);
                return null;
            }

            const audioTranscription = await this.audioTranscriptionRepository.save({
                createdBy: createdBy,
                textTranscription: transcription.text,
                urlFile: urlFile,
                workspaceId: workspaceId,
                conversationId: conversationId,
                externalId: externalId,
                totalTimeTranscription: Math.ceil(Number(transcription['duration'])),
            });

            await this.deleteAudioTranscriptionByExternalIdFromCache(workspaceId, externalId || urlFile);
            fs.unlinkSync(tempFilePath);

            return audioTranscription;
        } catch (error) {
            this.logger.error('AudioTranscriptionService.createAudioTranscription', error);
            return error;
        }
    }

    public async getAudioTranscription(id: string, workspaceId: string) {
        return await this.audioTranscriptionRepository.findOne({ id: id, workspaceId: workspaceId });
    }

    public async getAudioTranscriptionByExternalId(externalId: string, workspaceId: string) {
        return await this.audioTranscriptionRepository.findOne({ externalId, workspaceId: workspaceId });
    }

    public async getAudioTranscriptionsByConversationId(conversationId: string, workspaceId: string) {
        return await this.audioTranscriptionRepository
            .createQueryBuilder('audio')
            .select([
                'audio.id',
                'audio.textTranscription',
                'audio.externalId',
                'audio.conversationId',
                'audio.workspaceId',
            ])
            .where('audio.workspace_id = :workspaceId', { workspaceId })
            .andWhere('audio.conversation_id = :conversationId', { conversationId })
            .getMany();
    }
}
