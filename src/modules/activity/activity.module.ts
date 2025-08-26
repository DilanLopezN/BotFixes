import { AuthMiddleware } from './../auth/middleware/auth.middleware';
import { Module, MiddlewareConsumer, forwardRef } from '@nestjs/common';
import { ActivityService } from './services/activity.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitySchema } from './schema/activity.schema';
import { ActivityController } from './activity.controller';
import { EngineOutMessagesConsumerService } from './services/engine-out-messages-consumer.service';
import { EventsModule } from '../events/events.module';
import { CacheModule } from '../_core/cache/cache.module';
import { AckConsumerRedisService } from './services/ack-consumer-redis.service';
import { TeamModule } from '../team/team.module';
import { ConversationModule } from '../conversation/conversation.module';
import { ActivityUtilService } from './services/activity-util.service';
import { ConversationAttributeModuleV2 } from '../conversation-attribute-v2/conversation-attribute.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ActivitySearchModule } from '../analytics/search/activity-search/activity-search.module';
import { Amqpv2Module } from '../_core/amqpv2/amqpv2.module';
import { ActivityV2Module } from '../activity-v2/activity-v2.module';
import { ExternalDataService } from './services/external-data.service';
@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Activity', schema: ActivitySchema }]),
        Amqpv2Module,
        CacheModule,
        EventsModule,
        AnalyticsModule,
        TeamModule,
        ConversationAttributeModuleV2,
        forwardRef(() => ConversationModule),
        ActivitySearchModule,
        ActivityV2Module,
    ],
    providers: [
        ActivityService,
        EngineOutMessagesConsumerService,
        // AckConsumerCronService,
        AckConsumerRedisService,
        ActivityUtilService,
        ExternalDataService,
    ],
    exports: [ActivityService],
    controllers: [ActivityController],
})
export class ActivityModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ActivityController);
    }
}
