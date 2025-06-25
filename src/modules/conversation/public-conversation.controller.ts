import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('public-conversation')
@Controller('public')
@UseGuards(ThrottlerGuard)
@Throttle(12, 1)
export class PublicConversationController {
    constructor(private conversationService: ConversationService) {}

    @Get(':workspaceId/resume-real-time')
    getResumeRealTime(@Param('workspaceId') workspaceId: string) {
        return this.conversationService.publicGetConversationResume(workspaceId);
    }
}
