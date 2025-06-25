import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AudioTranscriptionService } from '../../context-ai/audio-transcription/services/audio-transcription.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { CreateAudioTranscriptionData } from '../../context-ai/audio-transcription/interfaces/audio-transcription.interface';
import { ChannelConfigService } from '../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    private audioTranscriptionService: AudioTranscriptionService;
    private workspaceService: WorkspacesService;
    private channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.audioTranscriptionService = this.moduleRef.get<AudioTranscriptionService>(AudioTranscriptionService, {
            strict: false,
        });
        this.workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, {
            strict: false,
        });
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
    }

    async createAudioTranscription(data: CreateAudioTranscriptionData) {
        const { conversationId, createdBy, externalId, urlFile, workspaceId } = data;
        return await this.audioTranscriptionService.createAudioTranscription({
            createdBy,
            workspaceId,
            urlFile,
            conversationId,
            externalId,
        });
    }

    async getAudioTranscriptionByExternalId(workspaceId: string, externalId: string) {
        return await this.audioTranscriptionService.getAudioTranscriptionByExternalId(externalId, workspaceId);
    }

    async getWorkspaceById(workspaceId: string) {
        return await this.workspaceService.getOne(workspaceId);
    }

    async getChannelConfig(token: string) {
        try {
            return await this.channelConfigService.getOneBtIdOrToken(token);
        } catch (e) {
            return null;
        }
    }
}
