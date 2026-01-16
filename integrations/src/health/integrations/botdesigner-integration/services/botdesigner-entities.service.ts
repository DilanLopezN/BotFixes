import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityFiltersParams } from 'kissbot-health-core';
import * as moment from 'moment';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { defaultAppointmentTypes } from '../../../entities/default-entities';
import { EntityDocument, TypeOfService } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
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
  IInsurancePlanCategoryEntity,
  IInsurancePlanEntity,
  IInsuranceSubPlanEntity,
  ILateralityEntity,
  IOccupationAreaEntity,
  IOrganizationUnitEntity,
  IOrganizationUnitLocationEntity,
  IProcedureEntity,
  ISpecialityEntity,
  ITypeOfServiceEntity,
} from '../../../interfaces/entity.interface';
import { BotdesignerApiService } from './botdesigner-api.service';
import { BotdesignerHelpersService } from './botdesigner-helpers.service';
import { FilterQuery } from 'mongoose';

@Injectable()
export class BotdesignerEntitiesService {
  constructor(
    @Inject(forwardRef(() => BotdesignerHelpersService))
    private readonly botdesignerHelpersService: BotdesignerHelpersService,
    private readonly botdesignerApiService: BotdesignerApiService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
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

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.botdesignerApiService.listOrganizationUnits(integration, {
        params,
      });
      const entities = data?.map((resource) => {
        const entity: IOrganizationUnitEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        if (resource.address) {
          const { address, district, city, zipCode } = resource.address;
          let fullAddress: string = '';

          if (address) {
            fullAddress += `${address.trim()}`;
          }

          if (district) {
            fullAddress += `, ${district.trim()}`;
          }

          if (city) {
            fullAddress += ` - ${city.trim()}`;
          }

          if (zipCode) {
            fullAddress += ` - ${zipCode.trim()}`;
          }

          entity.data = {
            address: fullAddress,
          };
        }

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listOrganizationUnits', error);
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.botdesignerApiService.listInsurances(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listInsurances', error);
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.botdesignerApiService.listSpecialities(integration, { params });
      const entities = data?.map((resource) => {
        const entity: ISpecialityEntity = {
          code: this.botdesignerHelpersService.createCompositeSpecialityCode(
            integration,
            resource.code,
            resource.appointmentTypeCode,
          ),
          name: resource.name,
          specialityType: resource.appointmentTypeCode,
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listSpecialities', error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const data = await this.botdesignerApiService.listInsurancePlans(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IInsurancePlanEntity = {
          code: this.botdesignerHelpersService.createCompositePlanCode(
            integration,
            resource.code,
            resource.insuranceCode,
          ),
          name: resource.name,
          insuranceCode: String(resource.insuranceCode),
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listInsurancePlans', error);
    }
  }

  public async listInsuranceSubPlans(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IInsuranceSubPlanEntity[]> {
    try {
      const data = await this.botdesignerApiService.listInsuranceSubPlans(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IInsuranceSubPlanEntity = {
          code: this.botdesignerHelpersService.createCompositeSubPlanCode(
            integration,
            resource.code,
            resource.insurancePlanCode,
            resource.insuranceCode,
          ),
          name: resource.name,
          insuranceCode: String(resource.insuranceCode),
          insurancePlanCode: String(resource.insurancePlanCode),
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listInsuranceSubPlans', error);
    }
  }

  public async listInsuranceCategories(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IInsurancePlanCategoryEntity[]> {
    try {
      const data = await this.botdesignerApiService.listInsuranceCategories(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IInsurancePlanCategoryEntity = {
          code: this.botdesignerHelpersService.createCompositePlanCategoryCode(
            integration,
            resource.code,
            resource.insuranceCode,
          ),
          name: resource.name,
          insuranceCode: String(resource.insuranceCode),
          insurancePlanCode: String(resource.insurancePlanCode),
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listInsuranceCategories', error);
    }
  }

  public async listDoctors(integration: IntegrationDocument, params: EntityFiltersParams): Promise<IDoctorEntity[]> {
    try {
      const data = await this.botdesignerApiService.listDoctors(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IDoctorEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
          order: resource.order,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listDoctors', error);
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IProcedureEntity[]> {
    try {
      const data = await this.botdesignerApiService.listProcedures(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IProcedureEntity = {
          code: this.botdesignerHelpersService.createCompositeProcedureCode(
            integration,
            resource.code,
            resource.specialityCode,
            resource.appointmentTypeCode,
            null,
            resource.handedness || this.botdesignerHelpersService.getHandedness(integration._id),
          ),
          name: resource.name,
          specialityCode: this.botdesignerHelpersService.createCompositeSpecialityCode(
            integration,
            resource.specialityCode,
            resource.appointmentTypeCode,
          ),
          specialityType: resource.appointmentTypeCode,
          ...this.getDefaultErpEntityData(integration),
          activeErp: resource.active,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listProcedures', error);
    }
  }

  public async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      const entities = defaultAppointmentTypes?.map((resource) => {
        const entity: IAppointmentTypeEntity = {
          code: resource.code,
          name: resource.name,
          params: {
            ...resource.params,
          },
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listAppointmentTypes', error);
    }
  }

  public async listTypeOfServices(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IAppointmentTypeEntity[]> {
    try {
      const data = await this.botdesignerApiService.listTypesOfService(integration, { params });
      const entities = data?.map((resource) => {
        const entity: ITypeOfServiceEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
          params: {
            referenceTypeOfService: TypeOfService.custom,
          },
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listTypeOfServices', error);
    }
  }

  public async listOccupationAreas(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IOccupationAreaEntity[]> {
    try {
      const data = await this.botdesignerApiService.listOccupationAreas(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IOccupationAreaEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listOccupationAreas', error);
    }
  }

  public async listOrganizationUnitLocations(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<IOrganizationUnitLocationEntity[]> {
    try {
      const data = await this.botdesignerApiService.listOrganizationUnitLocations(integration, { params });
      const entities = data?.map((resource) => {
        const entity: IOrganizationUnitLocationEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listOrganizationUnitLocations', error);
    }
  }

  public async listLateralities(
    integration: IntegrationDocument,
    params: EntityFiltersParams,
  ): Promise<ILateralityEntity[]> {
    try {
      const data = await this.botdesignerApiService.listLateralities(integration, { params });
      const entities = data?.map((resource) => {
        const entity: ILateralityEntity = {
          code: String(resource.code),
          name: resource.name,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listLateralities', error);
    }
  }

  public async listApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<T[]> {
    try {
      const allEntities = await this.extractEntity(integration, targetEntity, filters, cache, patient);
      const orderMap = new Map<string, number>();

      const codes = allEntities?.map((entity) => {
        if (entity.order) {
          orderMap.set(entity.code, entity.order);
        }

        return entity.code;
      });

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

      if (
        [
          EntityType.insurancePlan,
          EntityType.planCategory,
          EntityType.insuranceSubPlan,
          EntityType.planCategory,
        ].includes(targetEntity) &&
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

      const entities = dbEntities.map((entity) => {
        if (orderMap.has(entity.code)) {
          return { ...entity?.toJSON(), order: orderMap.get(entity.code) } as EntityTypes;
        }
        return entity;
      });

      if (cache && entities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, entities, codes);
      }

      return entities as unknown as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerEntitiesService.listValidApiEntities', error);
    }
  }

  private getResourceFilters(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    patient: InitialPatient,
  ): EntityFiltersParams {
    if (!Object.keys(filters ?? {}).length && !Object.keys(patient ?? {}).length) {
      return {};
    }

    const requestFilters: EntityFiltersParams = {} as EntityFiltersParams;

    if (filters.doctor?.code) {
      requestFilters.doctorCode = [filters.doctor.code];
    }

    if (filters.insurance?.code) {
      requestFilters.insuranceCode = [filters.insurance.code];
    }

    if (filters.appointmentType?.code) {
      requestFilters.appointmentTypeCode = [filters.appointmentType.code];
    }

    if (filters.insurancePlan?.code) {
      const insurancePlanData = this.botdesignerHelpersService.getCompositePlanCode(
        integration,
        filters.insurancePlan.code,
      );
      requestFilters.insurancePlanCode = [insurancePlanData.code];
    }

    if (filters.planCategory?.code) {
      const insuranceCategoryData = this.botdesignerHelpersService.getCompositePlanCategoryCode(
        integration,
        filters.planCategory.code,
      );
      requestFilters.insuranceCategoryCode = [insuranceCategoryData.code];
    }

    if (filters.insuranceSubPlan?.code) {
      const insuranceSubPlanData = this.botdesignerHelpersService.getCompositeSubPlanCode(
        integration,
        filters.insuranceSubPlan.code,
      );
      requestFilters.insuranceSubPlanCode = [insuranceSubPlanData.code];
    }

    if (filters.procedure?.code) {
      const procedureData = this.botdesignerHelpersService.getCompositeProcedureCode(
        integration,
        filters.procedure.code,
      );
      requestFilters.procedureCode = [procedureData.code];
    }

    if (filters.speciality?.code) {
      const specialityData = this.botdesignerHelpersService.getCompositeSpecialityCode(
        integration,
        filters.speciality.code,
      );
      requestFilters.specialityCode = [specialityData.code];
    }

    if (filters.organizationUnit?.code) {
      requestFilters.organizationUnitCode = [filters.organizationUnit.code];
    }

    if (filters.organizationUnitLocation?.code) {
      requestFilters.organizationUnitLocationCode = [filters.organizationUnitLocation.code];
    }

    if (filters.occupationArea?.code) {
      requestFilters.occupationAreaCode = [filters.occupationArea.code];
    }

    if (filters.typeOfService?.code) {
      requestFilters.typeOfServiceCode = [filters.typeOfService.code];
    }

    if (patient?.sex) {
      requestFilters.patientSex = patient.sex;
    }

    if (patient?.bornDate) {
      const patientAge = moment().diff(patient.bornDate, 'years');
      requestFilters.patientAge = patientAge;
    }

    return requestFilters;
  }

  private getValidFiltersToCacheEntities(targetEntity: EntityType, filters: EntityFiltersParams): EntityFiltersParams {
    if (targetEntity === EntityType.insurancePlan) {
      return {
        insuranceCode: filters.insuranceCode,
        appointmentTypeCode: filters.appointmentTypeCode,
      };
    }

    if (targetEntity === EntityType.insuranceSubPlan) {
      return {
        insuranceCode: filters.insuranceCode,
        insurancePlanCode: filters.insurancePlanCode,
        appointmentTypeCode: filters.appointmentTypeCode,
      };
    }

    if (targetEntity === EntityType.planCategory) {
      return {
        insuranceCode: filters.insuranceCode,
        appointmentTypeCode: filters.appointmentTypeCode,
      };
    }

    if (targetEntity === EntityType.speciality || targetEntity === EntityType.procedure) {
      filters.insurancePlanCode = undefined;
      filters.insuranceSubPlanCode = undefined;
      filters.insuranceCategoryCode = undefined;
    }

    if (![EntityType.procedure, EntityType.speciality, EntityType.doctor].includes(targetEntity)) {
      filters.patientAge = undefined;
      filters.patientSex = undefined;
    }

    return filters;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters?: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityTypes[]> {
    const requestFilters: EntityFiltersParams = this.getResourceFilters(integration, filters, patient);
    const resourceCacheParams = this.getValidFiltersToCacheEntities(entityType, { ...requestFilters });

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        resourceCacheParams,
      );

      if (resourceCache) {
        return resourceCache;
      }
    }

    const listResource = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return this.listOrganizationUnits(integration, requestFilters);

        case EntityType.insurance:
          return this.listInsurances(integration, requestFilters);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, requestFilters);

        case EntityType.insuranceSubPlan:
          return this.listInsuranceSubPlans(integration, requestFilters);

        case EntityType.doctor:
          return this.listDoctors(integration, requestFilters);

        case EntityType.speciality:
          return this.listSpecialities(integration, requestFilters);

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        case EntityType.typeOfService:
          return this.listTypeOfServices(integration, requestFilters);

        case EntityType.procedure:
          return this.listProcedures(integration, requestFilters);

        case EntityType.planCategory:
          return this.listInsuranceCategories(integration, requestFilters);

        case EntityType.occupationArea:
          return this.listOccupationAreas(integration, requestFilters);

        case EntityType.organizationUnitLocation:
          return this.listOrganizationUnitLocations(integration, requestFilters);

        case EntityType.laterality:
          return this.listLateralities(integration, requestFilters);

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await listResource();

    if (cache && resource?.length) {
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        entityType,
        integration,
        resourceCacheParams,
        resource,
        getExpirationByEntity(entityType),
      );
    }
    return resource;
  }
}
