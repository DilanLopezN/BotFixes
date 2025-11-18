import { forwardRef, Module } from '@nestjs/common';
import { FlowModule } from '../flow/flow.module';
import { AppointmentModule } from '../analytics/appointment/appointment.module';
import { EntitiesSuggestionService } from './entitites-suggestion.service';
import { EntitiesModule } from '../entities/entities.module';
import { InsuranceSuggestionService } from './insurance-suggestion.service';
import { DoctorSuggestionService } from './doctor-suggestion.service';
import { IntegratorModule } from '../integrator/integrator.module';

@Module({
  imports: [FlowModule, AppointmentModule, EntitiesModule, forwardRef(() => IntegratorModule)],
  providers: [EntitiesSuggestionService, InsuranceSuggestionService, DoctorSuggestionService],
  exports: [EntitiesSuggestionService],
})
export class EntitiesSuggestionModule {}
