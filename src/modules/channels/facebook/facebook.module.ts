import { Module } from "@nestjs/common";
import { ActivityModule } from "./../../activity/activity.module";
import { ChannelConfigModule } from "./../../channel-config/channel-config.module";
import { ConversationModule } from "./../../conversation/conversation.module";
import { FacebookController } from "./facebook.controller";
import { FacebookApiService } from "./services/facebook-api.service";
import { IncomingService } from "./services/incoming.service";
import { FacebookOutcomingConsumerService } from "./services/facebook-outcoming.service";
import { EventsModule } from "./../../events/events.module";
import { PrivateConversationDataModule } from "./../../private-conversation-data/private-conversation-data.module";
import { CacheModule } from "./../../_core/cache/cache.module";
import { AttachmentModule } from "./../../attachment/attachment.module";

@Module({
    controllers: [
        FacebookController,
    ],
    providers: [
        IncomingService,
        FacebookOutcomingConsumerService,
        FacebookApiService,
    ],
    imports: [
        ConversationModule,
        ChannelConfigModule,
        ActivityModule,
        EventsModule,
        PrivateConversationDataModule,
        CacheModule,
        AttachmentModule,
    ]
})
export class FacebookModule {}