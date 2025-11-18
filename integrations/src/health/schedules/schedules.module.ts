import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesModule } from '../entities/entities.module';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { Extractions } from './entities/extractions.entity';
import { Schedules } from './entities/schedules.entity';
import { SchedulesService } from './schedules.service';
import { FlowModule } from './../../health/flow/flow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedules, Extractions], INTEGRATIONS_CONNECTION_NAME),
    EntitiesModule,
    FlowModule,
  ],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
