import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { ListPatientSuggestedData, PatientSuggestedDoctors } from '../integrator/interfaces';
import { EntityDocument } from '../entities/schema';
import { FlowSteps } from '../flow/interfaces/flow.interface';
import { FlowService } from '../flow/service/flow.service';
import { IntegratorService } from '../integrator/service/integrator.service';
import { castObjectId, castObjectIdToString } from '../../common/helpers/cast-objectid';
import { EntitiesService } from '../entities/services/entities.service';
import { EntityType } from '../interfaces/entity.interface';

@Injectable()
export class DoctorSuggestionService {
  constructor(
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
    @Inject(forwardRef(() => IntegratorService))
    private readonly integratorService: IntegratorService,
  ) {}

  private async matchFlowEntities(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    { cpf, bornDate, filter }: ListPatientSuggestedData,
  ): Promise<EntityDocument[]> {
    const [validData] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entities: entities,
      targetEntity: FlowSteps.doctor,
      entitiesFilter: filter || null,
      filters: {
        patientBornDate: bornDate,
        patientCpf: cpf,
      },
    });

    return validData;
  }

  private async listSuggestedDoctors(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
  ): Promise<EntityDocument[]> {
    const doctors = await this.entitiesService.getModel(EntityType.doctor).find({
      integrationId: castObjectId(integration._id),
      'params.includeInSuggestionsList': true,
    });

    return this.matchFlowEntities(integration, doctors, data);
  }

  public async listPatientSuggestedDoctors(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
  ): Promise<PatientSuggestedDoctors> {
    const response: PatientSuggestedDoctors = {
      suggested: [],
      principal: [],
    };

    if (!data?.code) {
      return response;
    }

    const doctors = await this.integratorService.listSuggestedDoctors(castObjectIdToString(integration._id), {
      patientCode: data.code,
    });

    const matchedDoctors = await this.matchFlowEntities(integration, doctors, data);
    const principalDoctors = await this.listSuggestedDoctors(integration, data);

    return {
      ...response,
      suggested: matchedDoctors,
      principal: principalDoctors,
    };
  }
}
