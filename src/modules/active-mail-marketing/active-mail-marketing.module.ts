import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../config/config.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { EventsModule } from '../events/events.module';
import { CacheModule } from '../_core/cache/cache.module';
import { Amqpv2Module } from '../_core/amqpv2/amqpv2.module';
import { KafkaModule } from '../_core/kafka/kafka.module';
import { CampaignConfigController } from './controllers/campaign-config.controller';
import { EmailCampaignController } from './controllers/email-campaign.controller';
import { CampaignConfig } from './models/campaign-config.entity';
import { SendedCampaign } from './models/sended-campaign.entity';
import { IncomingRequest } from './models/incoming-request.entity';
import { CampaignConfigService } from './services/campaign-config.service';
import { EmailCampaignService } from './services/email-campaign.service';
import { EmailCampaignConsumerService } from './services/email-campaign-consumer.service';
import { ConversationUpdateConsumerService } from './services/conversation-update-consumer.service';
import { SendedCampaignService } from './services/sended-campaign.service';
import { IncomingRequestService } from './services/incoming-request.service';
import { ACTIVE_MAIL_MARKETING_CONNECTION } from './ormconfig';
import { synchronizePostgres } from '../../common/utils/sync';
import { CallbackRedirectController } from './controllers/callback-redirect.controller';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: ACTIVE_MAIL_MARKETING_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'active_mail_marketing',
        }),
        TypeOrmModule.forFeature([CampaignConfig, SendedCampaign, IncomingRequest], ACTIVE_MAIL_MARKETING_CONNECTION),
        EventsModule,
        CacheModule,
        Amqpv2Module,
        KafkaModule,
    ],
    controllers: [CampaignConfigController, EmailCampaignController, CallbackRedirectController],
    providers: [
        CampaignConfigService,
        EmailCampaignService,
        EmailCampaignConsumerService,
        ConversationUpdateConsumerService,
        SendedCampaignService,
        IncomingRequestService,
    ],
    exports: [CampaignConfigService, EmailCampaignService, SendedCampaignService, IncomingRequestService],
})
export class ActiveMailMarketingModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(CampaignConfigController);
    }
}
