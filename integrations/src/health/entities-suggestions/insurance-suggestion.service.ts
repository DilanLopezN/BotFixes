import { Injectable } from '@nestjs/common';
import { EntitiesService } from '../entities/services/entities.service';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { EntityType } from '../interfaces/entity.interface';
import {
  ListPatientSuggestedData,
  PatientSuggestedInsurances,
  SuggestedPatientInsurance,
} from '../integrator/interfaces';
import { EntityDocument, InsuranceEntityDocument } from '../entities/schema';
import { FlowSteps } from '../flow/interfaces/flow.interface';
import { FlowService } from '../flow/service/flow.service';
import { castObjectId, castObjectIdToString } from '../../common/helpers/cast-objectid';
import { AppointmentService } from '../analytics/appointment/appointment.service';

@Injectable()
export class InsuranceSuggestionService {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
  ) {}

  private async listParticularInsurances(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
  ): Promise<EntityDocument[]> {
    const particularInsurances = await this.entitiesService.getModel(EntityType.insurance).find({
      integrationId: castObjectId(integration._id),
      'params.isParticular': true,
    });

    return this.matchFlowEntities(integration, particularInsurances, data);
  }

  private async listSuggestedInsurances(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
  ): Promise<EntityDocument[]> {
    const particularInsurances = await this.entitiesService.getModel(EntityType.insurance).find({
      integrationId: castObjectId(integration._id),
      'params.includeInSuggestionsList': true,
    });

    return this.matchFlowEntities(integration, particularInsurances, data);
  }

  private async matchFlowEntities(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    { cpf, bornDate, filter }: ListPatientSuggestedData,
  ): Promise<EntityDocument[]> {
    const [validData] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entities: entities,
      targetEntity: FlowSteps.insurance,
      entitiesFilter: filter || null,
      filters: {
        patientBornDate: bornDate,
        patientCpf: cpf,
      },
    });

    return validData;
  }

  private async listPreviousInsurances(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
    particularInsurances: EntityDocument[],
    principalInsurances: EntityDocument[],
    validInsurances: InsuranceEntityDocument[] = [],
  ): Promise<SuggestedPatientInsurance[]> {
    const { cpf, bornDate, code, phone } = data;
    const particularInsurancesCodes: string[] = particularInsurances.map((insurance) => insurance.code);
    const principalInsurancesCodes: string[] = principalInsurances.map((insurance) => insurance.code);

    const schedules = await this.appointmentService.listPreviousInsurances({
      integrationId: castObjectIdToString(integration._id),
      patientBornDate: bornDate,
      patientCode: code,
      patientCpf: cpf,
      patientPhone: phone,
      insuranceCodesToIgnore: [...particularInsurancesCodes, ...principalInsurancesCodes],
    });

    const schedulesMap = schedules
      .filter((schedule) => schedule.insuranceCode)
      .reduce((acc, current) => {
        if (!acc[current.insuranceCode]) {
          acc[current.insuranceCode] = [];
        }

        acc[current.insuranceCode].push(current);
        return acc;
      }, {});

    const suggestedInsurances: SuggestedPatientInsurance[] = [];

    for (const insuranceCode of Object.keys(schedulesMap)) {
      const [schedule] = schedulesMap[insuranceCode];
      const suggestedInsurance: SuggestedPatientInsurance = {};

      if (schedule.insuranceCode) {
        const insuranceIsValid = !!validInsurances.find(
          (validInsurance) => validInsurance.code === schedule.insuranceCode,
        );

        if (!insuranceIsValid) {
          continue;
        }

        const insurance = await this.entitiesService.getModel(EntityType.insurance).findOne({
          integrationId: castObjectId(integration._id),
          code: schedule.insuranceCode,
        });

        if (insurance) {
          const [validInsurance] = await this.matchFlowEntities(integration, [insurance], data);
          suggestedInsurance[EntityType.insurance] = validInsurance;
        }

        if (schedule.insurancePlanCode && insurance) {
          const insurancePlan = await this.entitiesService.getModel(EntityType.insurancePlan).findOne({
            integrationId: castObjectId(integration._id),
            code: schedule.insurancePlanCode,
            insuranceCode: schedule.insuranceCode,
          });

          if (insurancePlan) {
            const [validInsurancePlan] = await this.matchFlowEntities(integration, [insurancePlan], data);
            suggestedInsurance[EntityType.insurancePlan] = validInsurancePlan;
          }
        }

        if (schedule.insuranceSubPlanCode && insurance) {
          const insuranceSubPlan = await this.entitiesService.getModel(EntityType.insuranceSubPlan).findOne({
            integrationId: castObjectId(integration._id),
            code: schedule.insuranceSubPlanCode,
            insuranceCode: schedule.insuranceCode,
          });

          if (insuranceSubPlan) {
            const [validInsuranceSubPlan] = await this.matchFlowEntities(integration, [insuranceSubPlan], data);
            suggestedInsurance[EntityType.insuranceSubPlan] = validInsuranceSubPlan;
          }
        }

        if (schedule.insuranceCategoryCode) {
          const insurancePlanCategory = await this.entitiesService.getModel(EntityType.planCategory).findOne({
            integrationId: castObjectId(integration._id),
            code: schedule.insuranceCategoryCode,
            insuranceCode: schedule.insuranceCode,
          });

          if (insurancePlanCategory) {
            const [validInsurancePlanCategory] = await this.matchFlowEntities(
              integration,
              [insurancePlanCategory],
              data,
            );
            suggestedInsurance[EntityType.planCategory] = validInsurancePlanCategory;
          }
        }
      }

      if (suggestedInsurance.insurance) {
        suggestedInsurances.push(suggestedInsurance);
      }
    }

    return suggestedInsurances.slice(0, 2);
  }

  public async listPatientSuggestedInsurances(
    integration: IntegrationDocument,
    data: ListPatientSuggestedData,
    validInsurances: InsuranceEntityDocument[],
  ): Promise<PatientSuggestedInsurances> {
    const response: PatientSuggestedInsurances = {
      suggested: [],
      principal: [],
      particular: [],
    };

    const particularInsurances = await this.listParticularInsurances(integration, data);
    const principalInsurances = await this.listSuggestedInsurances(integration, data);
    let suggestedInsurances: SuggestedPatientInsurance[] = [];

    // se não tiver cpf e nem code, não há necessidade de buscar convenios anteriores
    if (data?.cpf || data?.code) {
      suggestedInsurances = await this.listPreviousInsurances(
        integration,
        data,
        particularInsurances,
        principalInsurances,
        validInsurances,
      );
    }

    return {
      ...response,
      suggested: suggestedInsurances,
      principal: principalInsurances,
      particular: particularInsurances,
    };
  }
}
