
import { Module } from '@nestjs/common';
import { ChannelTelegramController } from './channel-telegram.controller';
import { TelegramWebhookService } from './services/telegram-webhook.service';
import { ChannelTelegramConsumerService } from './services/channel-telegram-consumer.service';
import { EventsModule } from './../../events/events.module';
import { ConversationModule } from './../../conversation/conversation.module';
import { ActivityModule } from './../../activity/activity.module';
import { AttachmentModule } from './../../attachment/attachment.module';
import { PrivateConversationDataModule } from './../../private-conversation-data/private-conversation-data.module';
import { ChannelConfigModule } from './../../channel-config/channel-config.module';
@Module({
    imports: [
        ConversationModule,
        ChannelConfigModule,
        ActivityModule,
        AttachmentModule,
        PrivateConversationDataModule,
        EventsModule,
    ],
    controllers: [
        ChannelTelegramController
    ],
    providers: [
        TelegramWebhookService,
        ChannelTelegramConsumerService
    ],
})
export class ChannelTelegramModule { }
