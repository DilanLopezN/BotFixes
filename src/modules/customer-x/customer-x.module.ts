import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { CacheModule } from '../_core/cache/cache.module';
import { CustomerXService } from './services/customer-x.service';
import { ExternalDataService } from './services/external-data.service';
import { EventsModule } from '../events/events.module';
import { MetricsCustomerXConsumerService } from './services/metrics-consumer.service';
@Module({
    imports: [ConfigModule, CacheModule, EventsModule],
    providers: [CustomerXService, MetricsCustomerXConsumerService, ExternalDataService],
    exports: [],
    controllers: [],
})
export class CustomerXModule {}
