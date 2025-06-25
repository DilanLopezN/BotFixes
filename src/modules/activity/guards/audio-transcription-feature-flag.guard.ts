import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from './../../auth/exceptions';
import { ExternalDataService } from '../services/external-data.service';

@Injectable()
export class AudioTranscriptionFeatureFlagGuard implements CanActivate {
    constructor(readonly reflector: Reflector, readonly externalDataService: ExternalDataService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const { workspaceId } = request.params;
        const user = request.user;

        const workspace = await this.externalDataService.getWorkspaceById(workspaceId);
        if (!workspace.featureFlag?.enableAudioTranscription) {
            throw Exceptions.AUDIO_TRANSCRIPTION_FEATURE_FLAG_NOT_ENABLED;
        }

        return true;
    }
}
