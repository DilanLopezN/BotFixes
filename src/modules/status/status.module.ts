import { CacheModule } from './../_core/cache/cache.module';
import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { Amqpv2Module } from '../_core/amqpv2/amqpv2.module';
import { AmqpModule } from '../_core/amqp/amqp.module';
import { ExternalDataService } from './external-data.service';
import { InternalStatusController } from './internal-status.controller';

@Module({
  imports: [
    Amqpv2Module,
    AmqpModule,
    CacheModule,
  ],
  providers: [StatusService, ExternalDataService],
  controllers: [StatusController, InternalStatusController],
})
export class StatusModule { }
