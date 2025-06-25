import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Head, Param, Redirect, Res } from '@nestjs/common';
import { TemplateMessageService } from '../services/template-message.service';
import { Response } from 'express';

@Controller('public-template-file')
@ApiTags('Template Messages')
export class PublicTemplateMessageController {
    constructor(private readonly templateMessageService: TemplateMessageService) {}

    @Head(':templateId/view')
    async viewAttachmentWithName(@Param('templateId') templateId: string, @Res() res: Response) {
        await new Promise((r) => setTimeout(r, 1000));
        const headers = await this.templateMessageService.headRequestView(templateId);
        Object.keys(headers).forEach((key) => {
            res.set(key, headers[key]);
        });
        res.status(200).send();
    }

    @Get(':templateId/view')
    @Redirect('http://localhost')
    async viewTemplateAttachment(@Param('templateId') templateId: string) {
        const { url } = await this.templateMessageService.view(templateId);
        return { url };
    }
}
