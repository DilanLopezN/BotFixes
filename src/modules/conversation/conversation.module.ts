import { EventsModule } from './../events/events.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { ConversationMetricsSchema, ConversationSchema, ConversationTagSchema } from './schema/conversation.schema';
import { ConversationAttributeConsumerService } from './services/conversation-attribute-consumer.service';
import { ConversationController } from './conversation.controller';
import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { UsersModule } from './../users/users.module';
import { ChannelConfigModule } from './../channel-config/channel-config.module';
import { ContactModule } from '../contact/contact.module';
import { ChannelLiveAgentModule } from '../channel-live-agent/channel-live-agent.module';
import { ActivityModule } from '../activity/activity.module';
import { TemplateMessageModule } from '../template-message/template-message.module';
import { TagsModule } from '../tags/tags.module';
import { TeamModule } from '../team/team.module';
import { WhatsappSessionControlModule } from '../whatsapp-session-control/whatsapp-session-control.module';
import { BotsModule } from '../bots/bots.module';
import { ConversationCallbackService } from './services/conversation-callback.service';
import { CacheModule } from '../_core/cache/cache.module';
import { IpMiddleware } from '../workspace-access-group/middleware/ip.middleware';
import { WorkspaceAccessGroupModule } from '../workspace-access-group/workspace-access-group.module';
import { AttachmentModule } from '../attachment/attachment.module';
import { ConversationAttributeModule } from '../conversation-attribute/conversation-attribute.module';
import { PrivateConversationDataModule } from '../private-conversation-data/private-conversation-data.module';
import { ConversationCronService } from './services/conversation-cron.service';
import { CreateConversationService } from './services/create-conversation.service';
import { ConversationSearchModule } from '../analytics/search/conversation-search/conversation-search.module';
import { AssignRequestConsumerService } from './services/assign-request-consumer.service';
import { ConversationContactConsumerService } from './services/conversation-contact-consumer.service';
import { TagConsumerService } from './services/tag-consumer.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CoreModule } from '../core/core.module';
import { AutoAssignModule } from '../auto-assign/auto-assign.module';
import { ExternalDataService } from './services/external-data.service';
import { PublicConversationController } from './public-conversation.controller';
import { CreateAgentConversationConsumerService } from './services/create-agent-conversation-consumer.service';

@Module({
    controllers: [ConversationController, PublicConversationController],
    imports: [
        MongooseModule.forFeature([
            { name: 'Conversation', schema: ConversationSchema },
            { name: 'ConversationMetrics', schema: ConversationMetricsSchema },
            { name: 'ConversationTag', schema: ConversationTagSchema },
        ]),
        EventsModule,
        UsersModule,
        TemplateMessageModule,
        TagsModule,
        TeamModule,
        forwardRef(() => ActivityModule),
        forwardRef(() => ChannelConfigModule),
        forwardRef(() => ContactModule),
        forwardRef(() => ChannelLiveAgentModule),
        forwardRef(() => AttachmentModule),
        WhatsappSessionControlModule,
        BotsModule,
        CacheModule,
        WorkspaceAccessGroupModule,
        ConversationAttributeModule,
        PrivateConversationDataModule,
        ConversationSearchModule,
        WorkspacesModule,
        AutoAssignModule,
    ],
    providers: [
        ConversationService,
        ConversationAttributeConsumerService,
        TagConsumerService,
        ConversationCallbackService,
        ConversationCronService,
        CreateConversationService,
        AssignRequestConsumerService,
        ConversationContactConsumerService,
        ExternalDataService,
        CreateAgentConversationConsumerService,
    ],
    exports: [ConversationService, MongooseModule, CreateConversationService],
})
export class ConversationModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware, IpMiddleware).forRoutes(ConversationController);
    }
}
