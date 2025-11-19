import { Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { EntitySourceType, EntityType, EntityTypes, EntityVersionType } from '../../../interfaces/entity.interface';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { BotdesignerFakeApiService } from './botdesigner-fake-api.service';
import { EntityDocument } from '../../../entities/schema';
import { InitialPatient } from '../../../integrator/interfaces';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FilterQuery } from 'mongoose';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { getFakeOrganizationUnitAddress } from '../utils/fake-data.util';

@Injectable()
export class BotdesignerFakeEntitiesService {
  constructor(
    private readonly botdesignerFakeApiService: BotdesignerFakeApiService,
    private readonly entitiesService: EntitiesService,
  ) {}

  private getDefaultEntityFields(integration: IntegrationDocument) {
    return {
      canSchedule: true,
      canView: true,
      activeErp: true,
      canCancel: true,
      order: -1,
      integrationId: integration._id,
      version: EntityVersionType.production,
      source: EntitySourceType.erp,
    };
  }

  async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    switch (entityType) {
      case EntityType.speciality:
        return this.getFakeSpecialities(integration);
      case EntityType.insurance:
        return this.getFakeInsurances(integration);
      case EntityType.doctor:
        return this.getFakeDoctors(integration);
      case EntityType.organizationUnit:
        return this.getFakeOrganizationUnits(integration);
      case EntityType.appointmentType:
        return this.getFakeAppointmentTypes(integration);
      case EntityType.procedure:
        return this.getFakeProcedures(integration, filter);
      case EntityType.organizationUnitLocation:
        return this.getFakeOrganizationUnitLocations(integration);
      default:
        return [];
    }
  }

  async listApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<T[]> {
    try {
      const allEntities = await this.extractEntity(integration, targetEntity, filters, cache);
      const codes = allEntities?.map((entity) => entity.code);

      const customFilters: FilterQuery<EntityDocument> = {};

      if (
        [EntityType.insurancePlan, EntityType.planCategory, EntityType.insuranceSubPlan].includes(targetEntity) &&
        filters?.insurance
      ) {
        customFilters.insuranceCode = filters.insurance.code;
      }

      const dbEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        targetEntity,
        customFilters,
      );

      return dbEntities as unknown as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeEntitiesService.listApiEntities', error);
    }
  }

  private async getFakeSpecialities(integration: IntegrationDocument): Promise<EntityTypes[]> {
    const specialities = await this.botdesignerFakeApiService.getFakeSpecialities();
    return specialities.map((spec) => ({
      code: spec.code,
      name: spec.name,
      specialityType: spec.specialityType,
      ...this.getDefaultEntityFields(integration),
    }));
  }

  private async getFakeInsurances(integration: IntegrationDocument): Promise<EntityTypes[]> {
    const insurances = await this.botdesignerFakeApiService.getFakeInsurances();
    return insurances.map((ins) => ({
      code: ins.code,
      name: ins.name,
      ...this.getDefaultEntityFields(integration),
    }));
  }

  private async getFakeDoctors(integration: IntegrationDocument): Promise<EntityTypes[]> {
    const doctors = await this.botdesignerFakeApiService.getFakeDoctors();
    return doctors.map((doc) => ({
      code: doc.code,
      name: doc.name,
      ...this.getDefaultEntityFields(integration),
    }));
  }

  private async getFakeOrganizationUnits(integration: IntegrationDocument): Promise<EntityTypes[]> {
    const organizationUnits = await this.botdesignerFakeApiService.getFakeOrganizationUnits();
    return organizationUnits.map((ou) => ({
      code: ou.code,
      name: ou.name,
      data: {
        address: getFakeOrganizationUnitAddress(ou.code),
      },
      ...this.getDefaultEntityFields(integration),
    }));
  }

  private async getFakeAppointmentTypes(integration: IntegrationDocument): Promise<EntityTypes[]> {
    const appointmentTypes = await this.botdesignerFakeApiService.getFakeAppointmentTypes();
    return appointmentTypes.map((at) => ({
      code: at.code,
      name: at.name,
      ...this.getDefaultEntityFields(integration),
    }));
  }

  private async getFakeProcedures(
    integration: IntegrationDocument,
    filters?: CorrelationFilter,
  ): Promise<EntityTypes[]> {
    const specialityCode = filters?.speciality?.code;
    const procedures = await this.botdesignerFakeApiService.getFakeProcedures(specialityCode);
    return procedures.map((proc) => ({
      code: proc.code,
      name: proc.name,
      specialityCode: proc.specialityCode,
      specialityType: proc.specialityType,
      ...this.getDefaultEntityFields(integration),
    }));
  }

  private async getFakeOrganizationUnitLocations(integration: IntegrationDocument): Promise<EntityTypes[]> {
    const organizationUnitLocations = await this.botdesignerFakeApiService.getFakeOrganizationUnitLocations();
    return organizationUnitLocations.map((oul) => ({
      code: oul.code,
      name: oul.name,
      ...this.getDefaultEntityFields(integration),
    }));
  }
}
