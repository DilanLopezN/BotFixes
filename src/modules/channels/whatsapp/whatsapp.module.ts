import { Module } from '@nestjs/common';
import { ExternalDataService } from './services/external-data.service';
import { WhatsappOutcomingConsumerService } from './services/whatsapp-outcoming-consumer.service';
import { Gupshupv3Module } from './providers/gupshup-v3/gupshup-v3.module';
import { Gupshupv2Module } from './providers/gupshup-v2/gupshup-v2.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WHATSAPP_CONNECTION } from './ormconfig';
import { synchronizePostgres } from '../../../common/utils/sync';
import { WhatsappUtilService } from './services/whatsapp-util.service';
import { Dialog360Module } from './providers/dialog360/dialog360.module';
import { WhatsappIdHashService } from './services/whatsapp-id-hash.service';
import { MetaWhatsappIncomingMessageConsumer } from './services/whatsapp-incoming-message-consumer.service';
import { MetaWhatsappIncomingAckConsumer } from './services/whatsapp-incoming-ack-consumer.service';
import { WhatsappBridgeService } from './services/whatsapp-bridge.service';
import { WppIdHash } from './models/wpp-id-hash.entity';
import { MetaWhatsappIncomingPartnerEventConsumer } from './services/whatsapp-incoming-partner-event-consumer.service';
import { WhatsappBillingEventService } from './services/whatsapp-billing-event.service';
import { WhatsappBillingEvent } from './models/whatsapp-billing-event.entity';

@Module({
    controllers: [],
    providers: [
        WhatsappOutcomingConsumerService,
        ExternalDataService,
        WhatsappUtilService,
        WhatsappIdHashService,
        WhatsappBillingEventService,
        MetaWhatsappIncomingMessageConsumer,
        MetaWhatsappIncomingAckConsumer,
        MetaWhatsappIncomingPartnerEventConsumer,
        WhatsappBridgeService,
    ],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: WHATSAPP_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'whatsapp',
        }),
        TypeOrmModule.forFeature([WppIdHash, WhatsappBillingEvent], WHATSAPP_CONNECTION),
        Gupshupv3Module,
        Dialog360Module,
        Gupshupv2Module,
    ],
})
export class WhatsappModule {}
