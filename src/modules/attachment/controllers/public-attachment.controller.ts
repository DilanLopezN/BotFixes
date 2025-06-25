import { ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Controller, Param, Res, Query, Redirect, Get, Head } from '@nestjs/common';
import { AttachmentService } from '../services/attachment.service';
import { Response } from 'express';

@Controller('conversations')
@ApiTags('Conversation')
export class PublicAttachmentController {
    constructor(private readonly attachmentService: AttachmentService) {}

    @Head(':conversationId/attachments/:attachmentId/view')
    async viewAttachmentWithName(
        @Param('attachmentId') attachmentId: string,
        @Param('name') name: string,
        @Res() res: Response,
    ) {
        await new Promise((r) => setTimeout(r, 1000));
        const headers = await this.attachmentService.headRequestView(attachmentId);
        Object.keys(headers).forEach((key) => {
            res.set(key, headers[key]);
        });
        res.status(200).setHeader('Cross-Origin-Resource-Policy', 'cross-origin').send();
    }

    @Get(':conversationId/attachments/:attachmentId/view')
    @ApiParam({ name: 'conversationId', type: String })
    @ApiParam({ name: 'attachmentId', type: String })
    @ApiResponse({ isArray: false, type: String, status: 200 })
    @Redirect('http://localhost')
    async viewAttachment(
        @Param('attachmentId') attachmentId: string,
        @Param('conversationId') conversationId: string,
        @Query('download') download: boolean,
        @Res() response: Response,
    ) {
        if (!attachmentId || attachmentId == 'undefined' || attachmentId == undefined) {
            console.log('conversationIdAttachment', conversationId);
        }
        const { url, attachment, stream } = await this.attachmentService.view(attachmentId, download);
        return { url };
    }
}
