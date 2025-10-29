import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AudioTranscriptionService } from '../../context-ai/audio-transcription/services/audio-transcription.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { CreateAudioTranscriptionData } from '../../context-ai/audio-transcription/interfaces/audio-transcription.interface';
import { ChannelConfigService } from '../../channel-config/channel-config.service';

@Injectable()
export class ExternalDataService {
    private _audioTranscriptionService: AudioTranscriptionService;
    private _workspaceService: WorkspacesService;
    private _channelConfigService: ChannelConfigService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get audioTranscriptionService(): AudioTranscriptionService {
        if (!this._audioTranscriptionService) {
            this._audioTranscriptionService = this.moduleRef.get<AudioTranscriptionService>(AudioTranscriptionService, {
                strict: false,
            });
        }
        return this._audioTranscriptionService;
    }

    private get workspaceService(): WorkspacesService {
        if (!this._workspaceService) {
            this._workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, {
                strict: false,
            });
        }
        return this._workspaceService;
    }

    private get channelConfigService(): ChannelConfigService {
        if (!this._channelConfigService) {
            this._channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        }
        return this._channelConfigService;
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
