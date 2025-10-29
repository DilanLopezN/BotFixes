import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailCampaignService } from '../services/email-campaign.service';
import { InitiateCampaignDto } from '../dto/initiate-campaign.dto';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Email Campaign')
@Controller('active-email-marketing')
export class EmailCampaignController {
    constructor(private readonly emailCampaignService: EmailCampaignService) {}

    @Post('initiate-campaign')
    @UseGuards(ThrottlerGuard)
    @Throttle(100, 60)
    async initiateEmailCampaign(@Body() data: InitiateCampaignDto): Promise<{ requestId: string; message: string }> {
        return await this.emailCampaignService.enqueueEmailCampaign(data);
    }
}
