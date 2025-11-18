import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { RabbitModule } from '../../common/rabbit-module/rabbit.module';

@Module({
  imports: [RabbitModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
