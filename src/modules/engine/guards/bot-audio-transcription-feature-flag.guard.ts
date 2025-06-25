import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from './../../auth/exceptions';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';

@Injectable()
export class BotAudioTranscriptionFeatureFlagGuard implements CanActivate {
    constructor(readonly reflector: Reflector, readonly workspacesService: WorkspacesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const { workspaceId } = request.params;
        const user = request.user;

        const workspace = await this.workspacesService.getOne(workspaceId);
        if (!workspace.featureFlag?.enableBotAudioTranscription) {
            throw Exceptions.AUDIO_TRANSCRIPTION_FEATURE_FLAG_NOT_ENABLED;
        }

        return true;
    }
}
