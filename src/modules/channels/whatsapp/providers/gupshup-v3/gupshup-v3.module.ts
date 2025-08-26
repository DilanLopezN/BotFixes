import { Module } from '@nestjs/common';
import { CacheModule } from './../../../../_core/cache/cache.module';
import { GupshupV3Service } from './../gupshup-v3/services/gupshup-v3.service';
import { GupshupV3UtilService } from './../gupshup-v3/services/gupshup-util.service';
import { ExternalDataService } from './services/external-data.service';
import { GupshupV3IncomingMessageConsumer } from './services/gupshup-v3-incoming-message-consumer.service';
import { GupshupV3IncomingService } from './services/gupshup-v3.incoming.service';
import { EventsModule } from '../../../../events/events.module';
import { KafkaModule } from '../../../../_core/kafka/kafka.module';
import { FileUploaderModule } from '../../../../../common/file-uploader/file-uploader.module';

@Module({
    controllers: [],
    providers: [
        GupshupV3Service,
        GupshupV3UtilService,
        ExternalDataService,
        GupshupV3IncomingMessageConsumer,
        GupshupV3IncomingService,
    ],
    imports: [CacheModule, EventsModule, KafkaModule, FileUploaderModule],
})
export class Gupshupv3Module {}
