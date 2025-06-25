import { Module } from '@nestjs/common';
import { CacheModule } from './../../../../_core/cache/cache.module';
import { EventsModule } from '../../../../events/events.module';
import { Dialog360UtilService } from './services/dialog360-util.service';
import { Dialog360IncomingService } from './services/dialog360.incoming.service';
import { Dialog360Service } from './services/dialog360.service';
import { ExternalDataService } from './services/external-data.service';
import { KafkaModule } from '../../../../_core/kafka/kafka.module';

@Module({
    controllers: [],
    providers: [Dialog360Service, Dialog360UtilService, Dialog360IncomingService, ExternalDataService],
    imports: [CacheModule, EventsModule, KafkaModule],
})
export class Dialog360Module {}
