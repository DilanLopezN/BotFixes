import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ActivityModule } from './../../activity/activity.module';
import { ChannelConfigModule } from './../../channel-config/channel-config.module';
import { CacheModule } from './../../_core/cache/cache.module';
import { ConversationModule } from './../../conversation/conversation.module';
import { GupshupUtilService } from './services/gupshup-util.service';
import { GupshupService } from './services/gupshup.service';
import { AttachmentModule } from './../../attachment/attachment.module';
import { FileUploaderModule } from './../../../common/file-uploader/file-uploader.module';
import { PrivateConversationDataModule } from './../../private-conversation-data/private-conversation-data.module';
import { EventsModule } from './../../events/events.module';
import { GupshupChannelConsumer } from './services/gupshup-channel-consumer.service';
import { GupshupIncomingMessageConsumer } from './services/gupshup-incoming-message-consumer.service';
import { GupshupIncomingSqs } from './services/gupshup-incoming-sqs.service';
import { ActiveMessageModule } from './../../active-message/active-message.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GUPSHUP_CONNECTION } from './ormconfig';
import { GupshupBillingEvent } from './models/gupshup-billing-event.entity';
import { ConfigModule } from './../../../config/config.module';
import { GupshupBillingEventService } from './services/gupshup-billing-event.service';
import { GupshupIncomingAckConsumer } from './services/gupshup-incoming-ack-consumer.service';
import { GupshupIdHashService } from './services/gupshup-id-hash.service';
import { GupshupIdHash } from './models/gupshup-id-hash.entity';
import { CheckPhoneNumberService } from './services/check-phone-number.service';
import { AmqpModule } from '../../_core/amqp/amqp.module';
import { MismatchWaidService } from './services/mismatch-waid.service';
import { ContactModule } from '../../contact/contact.module';
import { MismatchWaid } from './models/mismatch-waid.entity';
import { StorageModule } from '../../storage/storage.module';
import { TemplateMessageModule } from '../../template-message/template-message.module';
import { PartnerApiService } from './services/partner-api.service';
import { ReferralService } from './services/referral.service';
import { Referral } from './models/referral.entity';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { ChannelGupshupWhatsappController } from './gupshup.controller';
import { synchronizePostgres } from '../../../common/utils/sync';
import { GupshupHealthCheckService } from './services/gupshup-health-check.service';
import { ExternalDataService } from './services/external-data.service';

@Module({
    controllers: [ChannelGupshupWhatsappController],
    providers: [
        GupshupService,
        GupshupUtilService,
        GupshupChannelConsumer,
        GupshupIncomingMessageConsumer,
        GupshupIncomingAckConsumer,
        GupshupIncomingSqs,
        GupshupBillingEventService,
        GupshupIdHashService,
        CheckPhoneNumberService,
        MismatchWaidService,
        PartnerApiService,
        ReferralService,
        GupshupHealthCheckService,
        ExternalDataService,
    ],
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: GUPSHUP_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'gupshup',
        }),
        TypeOrmModule.forFeature([GupshupBillingEvent, GupshupIdHash, MismatchWaid, Referral], GUPSHUP_CONNECTION),
        AttachmentModule,
        AmqpModule,
        ConversationModule,
        ActivityModule,
        ChannelConfigModule,
        ContactModule,
        CacheModule,
        FileUploaderModule,
        PrivateConversationDataModule,
        EventsModule,
        ActiveMessageModule,
        StorageModule,
        TemplateMessageModule,
    ],
})
export class GupshupModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ChannelGupshupWhatsappController);
    }
}
