import { Module } from '@nestjs/common';
import { CacheModule } from './../../../../_core/cache/cache.module';
import { GupshupV2Service } from '../gupshup-v2/services/gupshup-v2.service';
import { GupshupV2UtilService } from '../gupshup-v2/services/gupshup-util.service';
import { ExternalDataService } from './services/external-data.service';
import { EventsModule } from '../../../../events/events.module';
import { KafkaModule } from '../../../../_core/kafka/kafka.module';
import { FileUploaderModule } from '../../../../../common/file-uploader/file-uploader.module';

@Module({
    controllers: [],
    providers: [GupshupV2Service, GupshupV2UtilService, ExternalDataService],
    imports: [CacheModule, EventsModule, KafkaModule, FileUploaderModule],
})
export class Gupshupv2Module {}
