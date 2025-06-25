import { Module } from '@nestjs/common';
import { ChannelTelegramModule } from './channel-telegram/channel-telegram.module';
import { FacebookModule } from './facebook/facebook.module';
import { GupshupModule } from './gupshup/gupshup.module';
import { WebchatModule } from './webchat/webchat.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
    imports: [WebchatModule, GupshupModule, ChannelTelegramModule, FacebookModule, WhatsappModule],
    exports: [WebchatModule, GupshupModule, ChannelTelegramModule, FacebookModule, WhatsappModule],
})
export class ChannelsModule {}
