import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmailCampaignService } from '../services/email-campaign.service';

@Controller('c')
export class CallbackRedirectController {
    constructor(private readonly emailCampaignService: EmailCampaignService) {}

    @Get(':shortId')
    async updateAccessed(@Res() res: Response, @Param('shortId') shortId: string): Promise<void> {
        const { redirectUrl } = await this.emailCampaignService.handleCallback(shortId);

        return res.redirect(redirectUrl);
    }
}
