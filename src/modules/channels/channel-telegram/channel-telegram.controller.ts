import { Controller, Body, Post, Param, Query } from '@nestjs/common';
import { TelegramWebhookService } from './services/telegram-webhook.service';
@Controller('/channels')
export class ChannelTelegramController {
    constructor(
        private readonly webhookService: TelegramWebhookService,
    ) { }

    @Post('/telegram/:channelConfigToken')
    message(
        @Param('channelConfigToken') channelConfigToken,
        @Body() body
    ){
        return this.webhookService.handleMessage(body, channelConfigToken);
    }
}
