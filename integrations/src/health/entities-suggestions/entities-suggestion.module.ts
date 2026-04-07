import { forwardRef, Module } from '@nestjs/common';
import { FlowModule } from '../flow/flow.module';
import { AppointmentModule } from '../analytics/appointment/appointment.module';
import { EntitiesSuggestionService } from './entitites-suggestion.service';
import { EntitiesModule } from '../entities/entities.module';
import { InsuranceSuggestionService } from './insurance-suggestion.service';
import { DoctorSuggestionService } from './doctor-suggestion.service';
import { IntegratorModule } from '../integrator/integrator.module';
import { ScheduleSuggestionService } from './schedule-suggestion.service';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [FlowModule, AppointmentModule, EntitiesModule, forwardRef(() => IntegratorModule), CacheModule],
  providers: [
    EntitiesSuggestionService,
    InsuranceSuggestionService,
    DoctorSuggestionService,
    ScheduleSuggestionService,
  ],
  exports: [EntitiesSuggestionService, ScheduleSuggestionService],
})
export class EntitiesSuggestionModule {}
