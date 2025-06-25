import { Module } from '@nestjs/common';
import { ConversationModule } from './../../conversation/conversation.module';
import { ChannelConfigModule } from './../../channel-config/channel-config.module';
import { WebchatService } from './services/webchat.service';
import { WebchatController } from './webchat.controller';
import { PrivateConversationDataModule } from './../../private-conversation-data/private-conversation-data.module';
import { ActivityModule } from './../../activity/activity.module';
import { EventsModule } from './../../events/events.module';
import { WebchatChannelConsumerService } from './services/webchat-channel-consumer.service';
import { AttachmentModule } from '../../../modules/attachment/attachment.module';

@Module({
    providers: [WebchatService, WebchatChannelConsumerService],
    exports: [WebchatService],
    controllers: [WebchatController],
    imports: [
        ChannelConfigModule,
        ConversationModule,
        PrivateConversationDataModule,
        ActivityModule,
        EventsModule,
        AttachmentModule,
    ],
})
export class WebchatModule {}
