import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { AmqpModule } from '../amqp/amqp.module';

@Module({
  imports: [AmqpModule],
  providers: [EventsService],
  exports: [EventsService],
  controllers: [],
})
export class EventsModule {}
