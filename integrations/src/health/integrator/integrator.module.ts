import { forwardRef, Module } from '@nestjs/common';
import { IntegrationModule } from '../integration/integration.module';
import { IntegratorService } from './service/integrator.service';
import { FlowModule } from '../flow/flow.module';
import { EntitiesModule } from '../entities/entities.module';
import { IntegratorTriggersService } from './service/integrator-triggers.service';
import { IntegrationCacheUtilsModule } from '../integration-cache-utils/integration-cache-utils.module';
import { CacheModule } from '../../core/cache/cache.module';
import { PatientDataModule } from '../patient-data/patient-data.module';
import { AuditModule } from '../audit/audit.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { RulesHandlerModule } from '../rules-handler/rules-handler.module';
import { IntegratorController } from './controllers/integrator.controller';
import { ConfirmationController } from './controllers/confirmation.controller';
import { DoctorController } from './controllers/doctor.controller';
import { SharedModule } from '../shared/shared.module';
import { EntitiesSuggestionModule } from '../entities-suggestions/entities-suggestion.module';
import { EventsModule } from '../events/events.module';
import { IntegratorValidatorsModule } from './validators/integrator-validators.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { ReportProcessorModule } from 'health/report-processor/report-processor.module';

@Module({
  imports: [
    IntegratorValidatorsModule,
    EntitiesModule,
    IntegrationModule,
    FlowModule,
    CacheModule,
    IntegrationCacheUtilsModule,
    PatientDataModule,
    AuditModule,
    IntegrationsModule,
    RulesHandlerModule,
    SharedModule,
    EntitiesSuggestionModule,
    forwardRef(() => SchedulingModule),
    EventsModule,
    ReportProcessorModule,
  ],
  controllers: [IntegratorController, ConfirmationController, DoctorController],
  providers: [IntegratorService, IntegratorTriggersService],
  exports: [IntegratorService],
})
export class IntegratorModule {}
