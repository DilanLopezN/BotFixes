import { Module } from '@nestjs/common';
import { ScheduleNotificationService } from './services/schedule-notification.service';
import { ScheduleNotificationController } from './schedule-notification.controller';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { IntegratorModule } from '../integrator/integrator.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SchedulingModule, IntegratorModule, AuditModule],
  providers: [ScheduleNotificationService],
  exports: [ScheduleNotificationService],
  controllers: [ScheduleNotificationController],
})
export class ScheduleNotificationModule {}
