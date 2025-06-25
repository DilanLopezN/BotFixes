import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { ContactQueueConsumerService } from './services/contact-queue-consumer.service';
import { ContactSchema } from './schema/contact.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { ContactService } from './services/contact.service';
import { ContactController } from './contact.controller';
import { EventsModule } from './../events/events.module';
import { ConversationModule } from './../conversation/conversation.module';
import { CacheModule } from '../_core/cache/cache.module';
import { ChannelConfigModule } from '../channel-config/channel-config.module';
import { BlockedContactService } from './services/blocked-contact.service';
import { BlockedContactSchema } from './schema/blocked-contact.schema';
import { ContactModuleV2 } from '../contact-v2/contact.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Contact', schema: ContactSchema },
            { name: 'BlockedContact', schema: BlockedContactSchema },
        ]),
        EventsModule,
        forwardRef(() => ConversationModule),
        CacheModule,
        ChannelConfigModule,
        WorkspacesModule,
        forwardRef(() => ContactModuleV2),
    ],
    providers: [ContactService, ContactQueueConsumerService, BlockedContactService],
    controllers: [ContactController],
    exports: [ContactService, BlockedContactService],
})
export class ContactModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContactController);
    }
}
