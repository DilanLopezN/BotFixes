import { Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import {
  ListPatientSuggestedData,
  PatientSuggestedDoctors,
  PatientSuggestedInsurances,
} from '../integrator/interfaces';
import { InsuranceSuggestionService } from './insurance-suggestion.service';
import { EntityType } from '../interfaces/entity.interface';
import { EntityDocument } from '../entities/schema';
import { DoctorSuggestionService } from './doctor-suggestion.service';

@Injectable()
export class EntitiesSuggestionService {
  constructor(
    private readonly insuranceSuggestionService: InsuranceSuggestionService,
    private readonly doctorSuggestionService: DoctorSuggestionService,
  ) {}

  public async listSuggestedEntities(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
    targetEntity: EntityType,
    entities: EntityDocument[],
  ): Promise<PatientSuggestedInsurances | PatientSuggestedDoctors> {
    if (targetEntity === EntityType.insurance) {
      return await this.insuranceSuggestionService.listPatientSuggestedInsurances(integration, data, entities);
    }

    if (targetEntity === EntityType.doctor) {
      return await this.doctorSuggestionService.listPatientSuggestedDoctors(integration, data);
    }

    return null;
  }
}
