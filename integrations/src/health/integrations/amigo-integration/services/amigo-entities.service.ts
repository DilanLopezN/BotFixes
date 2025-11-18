import { Injectable } from '@nestjs/common';

import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { InitialPatient } from '../../../integrator/interfaces';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  EntityVersionType,
  IAppointmentTypeEntity,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';

import { FilterQuery } from 'mongoose';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { defaultAppointmentTypes } from '../../../entities/default-entities';
import { EntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { AmigoApiService } from './amigo-api.service';
import { AmigoHelpersService } from './amigo-helpers.service';
import {
  AmigoDoctorsParamsRequest,
  AmigoInsuranceParamsRequest,
  AmigoInsurancePlansParamsRequest,
  AmigoInsurancePlansResponse,
  AmigoProceduresParamsRequest,
  AmigoProceduresResponse,
} from '../interfaces/base-register.interface';

@Injectable()
export class AmigoEntitiesService {
  constructor(
    private readonly apiService: AmigoApiService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly amigoHelpersService: AmigoHelpersService,
  ) {}

  private getDefaultErpEntityData(
    integration: IntegrationDocument,
  ): Pick<EntityDocument, 'integrationId' | 'source' | 'activeErp' | 'version'> {
    return {
      integrationId: castObjectId(integration._id),
      source: EntitySourceType.erp,
      activeErp: true,
      version: EntityVersionType.production,
    };
  }

  public async listValidApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    patient?: InitialPatient,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const data = await this.extractEntity(integration, targetEntity, filters, patient, cache);
      const codes = data?.map((entity) => entity.code);

      if (cache) {
        const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
          integration,
          targetEntity,
          codes,
        );

        if (cachedEntities) {
          return cachedEntities as unknown as T[];
        }
      }

      const customFilters: FilterQuery<EntityDocument> = {};

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        targetEntity,
        customFilters,
      );

      if (cache && entities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, entities, codes);
      }

      return entities as unknown as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listValidApiEntities.name, error);
    }
  }

  public async listOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.apiService.listOrganizationUnits(integration);
      if (!response.length) {
        return [];
      }

      return response
        ?.filter((resource) => resource.name?.length)
        .map((resource) => ({
          code: String(resource.id),
          name: String(resource.name),
          data: { address: resource.address },
          ...this.getDefaultErpEntityData(integration),
        }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listOrganizationUnits.name, error);
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    params?: AmigoInsuranceParamsRequest,
  ): Promise<IInsuranceEntity[]> {
    try {
      const response = await this.apiService.listInsurances(integration, params);
      if (!response.length) {
        return [];
      }

      return response
        ?.filter((resource) => resource.name?.length)
        .map((resource) => {
          const entity = {
            code: String(resource.id),
            name: String(resource.name)?.trim(),
            ...this.getDefaultErpEntityData(integration),
          };
          return entity;
        });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listInsurances.name, error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params?: AmigoInsurancePlansParamsRequest,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      let insurances: AmigoInsurancePlansResponse['planosList'];
      if (params.insuranceId) {
        insurances = await this.apiService.listInsurances(integration, params);
        if (!insurances.length) {
          return [];
        }
      } else {
        insurances = [{ id: undefined, name: undefined }];
      }

      let response: IInsurancePlanEntity[] = [];
      const promises = insurances.map(async (insurance) => {
        const insurancePlans = await this.apiService.listInsurancePlans(integration, {
          ...params,
          insuranceId: insurance.id,
        });
        if (!insurancePlans.length) {
          return null;
        }

        insurancePlans
          ?.filter((resource) => resource.name?.length)
          .forEach((plan) => {
            response.push({
              code: String(plan.id),
              insuranceCode: String(insurance.id || -1),
              name: plan.name,
              ...this.getDefaultErpEntityData(integration),
            });
          });
      });

      await Promise.all(promises);
      if (!response.length) {
        return [];
      }
      return response;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listInsurancePlans.name, error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    params?: AmigoDoctorsParamsRequest,
  ): Promise<IDoctorEntity[]> {
    try {
      let procedures: AmigoProceduresResponse['eventsList'];
      if (!params.event_id) {
        procedures = await this.apiService.listProcedures(integration);
        if (!procedures.length) {
          return [];
        }
      } else {
        procedures = [{ id: Number(params.event_id), name: '' }];
      }

      let response: Set<IDoctorEntity> = new Set<IDoctorEntity>();
      const promises = procedures.map(async (procedure) => {
        const doctors = await this.apiService.listDoctors(integration, { ...params, event_id: String(procedure.id) });
        if (!doctors.length) {
          return null;
        }

        doctors
          ?.filter((resource) => resource.name?.length)
          .forEach((plan) => {
            response.add({
              code: String(plan.id),
              name: plan.name,
              ...this.getDefaultErpEntityData(integration),
            });
          });
      });

      await Promise.all(promises);
      return [...response.values()];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listDoctors.name, error);
    }
  }

  public async listSpecialities(integration: IntegrationDocument): Promise<ISpecialityEntity[]> {
    try {
      const response = await this.apiService.listSpecialities(integration);
      if (!response.length) {
        return [];
      }

      return response
        ?.filter((resource) => resource?.length)
        .map((resource) => {
          const entity = {
            specialityType: SpecialityTypes.C,
            code: String(resource),
            name: String(resource),
            ...this.getDefaultErpEntityData(integration),
          };
          return entity;
        });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listSpecialities.name, error);
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    params?: AmigoProceduresParamsRequest,
  ): Promise<IProcedureEntity[]> {
    try {
      const response = await this.apiService.listProcedures(integration, params);
      if (!response.length) {
        return [];
      }

      return response
        ?.filter((resource) => resource.name?.length)
        .map((resource) => {
          const entity = {
            specialityCode: '-1',
            specialityType: SpecialityTypes.C,
            code: String(resource.id),
            name: String(resource.name),
            ...this.getDefaultErpEntityData(integration),
          };
          return entity;
        });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listProcedures.name, error);
    }
  }

  public async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return defaultAppointmentTypes.map((resource) => {
        const entity: IAppointmentTypeEntity = {
          code: resource.code,
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
          params: {
            ...resource.params,
          },
        };

        return entity;
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.listAppointmentTypes.name, error);
    }
  }

  public async extractEntity(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters?: CorrelationFilter,
    patient?: InitialPatient,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const resourceCacheParams = Object.keys(filters ?? {}).reduce((acc, key) => {
      acc[key] = filters[key].code;
      return acc;
    }, {});

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        targetEntity,
        integration,
        resourceCacheParams,
      );

      if (resourceCache) {
        return resourceCache;
      }
    }

    const listResource = () => {
      switch (targetEntity) {
        case EntityType.organizationUnit:
          return this.listOrganizationUnits(integration);

        case EntityType.insurance:
          return this.listInsurancePlans(
            integration,
            this.amigoHelpersService.filterBlankParams({
              place_id: filters?.organizationUnit?.code,
              user_id: filters?.doctor?.code,
              event_id: filters?.procedure?.code,
            }),
          );

        case EntityType.insurancePlan:
          return this.listInsurancePlans(
            integration,
            this.amigoHelpersService.filterBlankParams({
              insuranceId: filters?.insurance?.code,
              event_id: filters?.procedure?.code,
              place_id: filters?.organizationUnit?.code,
              user_id: filters?.doctor?.code,
            }),
          );

        case EntityType.doctor:
          return this.listDoctors(
            integration,
            this.amigoHelpersService.filterBlankParams({
              event_id: filters?.procedure?.code,
              insurance_id: filters?.insurance?.code,
              place_id: filters?.organizationUnit?.code,
              specialty: filters?.speciality?.code,
            }),
          );

        case EntityType.speciality:
          return this.listSpecialities(integration);

        case EntityType.procedure:
          return this.listProcedures(
            integration,
            this.amigoHelpersService.filterBlankParams({
              // insurance_id: filters?.insurance?.code,
              // place_id: filters?.organizationUnit?.code,
            }),
          );

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await listResource();

    if (cache && resource?.length) {
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        targetEntity,
        integration,
        resourceCacheParams,
        resource,
        getExpirationByEntity(targetEntity),
      );
    }

    return resource;
  }
}
