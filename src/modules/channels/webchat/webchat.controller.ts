import { FileInterceptor } from '@nestjs/platform-express';
import {
    Controller,
    Post,
    Body,
    Param,
    Get,
    UseInterceptors,
    UploadedFile,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiExcludeEndpoint } from '@nestjs/swagger';
import { WebchatService } from './services/webchat.service';
import { CreateWebchatConversationDto } from './dto/create-webchat-conversation.dto';
import { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
@Controller('webchat')
export class WebchatController {
    constructor(private readonly channelWebchatService: WebchatService) {}

    /**
     * Cria uma conversa
     * @param body
     */
    @Post('conversations')
    createConversation(@Body() body: CreateWebchatConversationDto) {
        return this.channelWebchatService.createConversation(body);
    }

    /**
     * Envia uma activity para um channel
     * @param body
     * @param conversationId
     */
    @UseGuards(ThrottlerGuard)
    @Throttle(12, 1)
    @Post('conversations/:conversationId/activities')
    @ApiExcludeEndpoint()
    createActivitiy(@Body() body: any, @Param('conversationId') conversationId: string, @Req() req: Request) {
        return this.channelWebchatService.handleActivity(body, conversationId);
    }

    /**
     * Pega uma conversa existente
     * @param conversationId
     */
    @Get('conversations/:conversationId')
    @ApiExcludeEndpoint()
    @ApiParam({
        name: 'conversationId',
        type: String,
        required: true,
    })
    async getActivities(@Param('conversationId') conversationId: any) {
        return await this.channelWebchatService.getConversation(conversationId);
    }

    @Post('conversations/:conversationId/upload')
    @ApiExcludeEndpoint()
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5000000 } }))
    async create(
        @Param('conversationId') conversationId: string,
        @UploadedFile() file: any,
        @Query('userId') memberId: string,
    ) {
        return await this.channelWebchatService.createAndUpload(file, conversationId, memberId);
    }
}
