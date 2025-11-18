import { Module } from '@nestjs/common';
import { EntitiesModule } from '../entities/entities.module';
import { IntegrationCacheUtilsModule } from '../integration-cache-utils/integration-cache-utils.module';
import { AppointmentService } from './appointment.service';
import { InterAppointmentService } from './inter-appointment.service';
import { SentryErrorHandlerService } from './metadata-sentry.service';
import { EntitiesFiltersService } from './entities-filters.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [EntitiesModule, IntegrationCacheUtilsModule, AuditModule],
  providers: [InterAppointmentService, AppointmentService, EntitiesFiltersService, SentryErrorHandlerService],
  exports: [InterAppointmentService, AppointmentService, EntitiesFiltersService, SentryErrorHandlerService],
})
export class SharedModule {}
