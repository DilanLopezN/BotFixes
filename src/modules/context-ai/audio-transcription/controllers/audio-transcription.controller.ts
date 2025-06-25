import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { AudioTranscriptionService } from '../services/audio-transcription.service';
import { AudioTranscription } from '../models/audio-transcription.entity';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
    PredefinedRoles.WORKSPACE_ADMIN,
];

@Controller('workspaces/:workspaceId/conversation-ai/audio-transcription')
export class AudioTranscriptionController {
    constructor(private readonly audioTranscriptionService: AudioTranscriptionService) {}

    @HttpCode(HttpStatus.OK)
    @Get('/audio/:audioId')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getAudioTranscriptionById(
        @Param('workspaceId') workspaceId: string,
        @Param('audioId') audioId: string,
    ): Promise<AudioTranscription> {
        return await this.audioTranscriptionService.getAudioTranscription(audioId, workspaceId);
    }
}
