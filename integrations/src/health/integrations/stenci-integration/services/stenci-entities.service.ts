import { Injectable } from '@nestjs/common';
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
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { StenciApiService } from './stenci-api.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { EntityDocument } from '../../../entities/schema';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { FilterQuery } from 'mongoose';
import { InitialPatient } from '../../../integrator/interfaces';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';

interface ListValidEntities {
  integration: IntegrationDocument;
  targetEntity: EntityType;
  filters: CorrelationFilter;
  cache?: boolean;
  patient?: InitialPatient;
  fromImport?: boolean;
}

@Injectable()
export class StenciEntitiesService {
  constructor(
    private readonly stenciApiService: StenciApiService,
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

  public async listValidApiEntities<T>(data: ListValidEntities): Promise<T[]> {
    const { integration, targetEntity, cache } = data;

    try {
      const entities = await this.extractEntity(data);
      const codes = entities?.map((entity) => entity.code) ?? [];

      if (!codes?.length) {
        return [];
      }

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
      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        targetEntity,
        customFilters,
      );

      if (cache && validEntities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, validEntities, codes);
      }

      return validEntities as unknown as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('Stenci.listValidApiEntities', error);
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<IInsuranceEntity[]> {
    try {
      const params: any = {
        active: true,
        limit: 1000,
      };

      if (filters?.procedure?.code) {
        params.serviceId = filters.procedure.code;
      }

      const response = await this.stenciApiService.listInsurancePlans(
        integration,
        params,
        filters.organizationUnit?.code,
      );
      const dataMap = new Map();
      response.forEach((el) => el.items?.forEach((item) => dataMap.set(item.insurance.id, item.insurance)));
      const data = Array.from(dataMap.values());

      return data.map((resource) => ({
        code: String(resource.id),
        name: String(resource.name)?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listInsurances', error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const params: any = {
        active: true,
        limit: 1000,
      };

      if (filters?.procedure?.code) {
        params.serviceId = filters.procedure.code;
      }

      const response = await this.stenciApiService.listInsurancePlans(
        integration,
        params,
        filters.organizationUnit?.code,
      );
      const dataMap = new Map();
      response.forEach((el) => el.items?.forEach((item) => dataMap.set(item.id, item)));
      let data = Array.from(dataMap.values());

      if (filters.insurance?.code) {
        data = data.filter((resource) => resource.insurance?.id == filters.insurance.code);
      }

      return data.map((resource) => ({
        code: String(resource.id),
        name: resource.fullName?.trim(),
        insuranceCode: resource.insurance?.id,
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listInsurancePlans', error);
    }
  }

  public async listProfessionals(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<IDoctorEntity[]> {
    try {
      const params: any = {
        active: true,
        limit: 1000,
      };

      if (filters?.insurancePlan?.code) {
        params.insurancePlanId = filters.insurancePlan.code;
      }

      if (filters?.speciality?.code) {
        params.specialtyCode = filters.speciality.code;
      }

      const response = await this.stenciApiService.listProfessionals(
        integration,
        params,
        filters.organizationUnit?.code,
      );
      const dataMap = new Map();
      response.forEach((el) => el.items?.forEach((item) => dataMap.set(item.id, item)));
      const data = Array.from(dataMap.values());

      return data.map((resource) => ({
        code: String(resource.id),
        name: String(resource.name)?.trim(),
        ...this.getDefaultErpEntityData(integration),
        data: {
          council: resource.council,
          specialties: resource.specialties,
          identity: resource.identity,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listProfessionals', error);
    }
  }

  public async listSpecialties(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<ISpecialityEntity[]> {
    try {
      const params: any = {
        limit: 1000,
      };

      const response = await this.stenciApiService.listSpecialties(integration, params, filters.organizationUnit?.code);
      const dataMap = new Map();
      response.forEach((el) => el.items?.forEach((item) => dataMap.set(item.code, item)));
      const data = Array.from(dataMap.values());

      return data.map((resource) => ({
        code: String(resource.code),
        name: String(resource.name)?.trim(),
        specialityType: SpecialityTypes.C,
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listSpecialties', error);
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<IProcedureEntity[]> {
    try {
      const params: any = {
        active: true,
        type: 'consultation',
        limit: 1000,
      };

      if (filters?.insurancePlan?.code) {
        params.insurancePlanId = filters.insurancePlan.code;
      }

      if (filters?.speciality?.code) {
        params.specialtyCode = filters.speciality.code;
      }

      const response = await this.stenciApiService.listProcedures(integration, params, filters.organizationUnit?.code);
      const dataMap = new Map();
      response.forEach((el) => el.items?.forEach((item) => dataMap.set(item.id, item)));
      const data = Array.from(dataMap.values());

      return data.map((resource) => {
        const entity: IProcedureEntity = {
          code: String(resource.id),
          name: String(resource.name)?.trim(),
          specialityType: SpecialityTypes.C,
          specialityCode: resource.specialty?.code || '-1',
          ...this.getDefaultErpEntityData(integration),
          data: {
            type: resource.type,
            tuss: resource.tuss,
            specialty: resource.specialty,
          },
        };
        return entity;
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listProcedures', error);
    }
  }

  public async listAppointmentTypes(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<IAppointmentTypeEntity[]> {
    try {
      // Stenci usa os services como appointmentTypes
      // Retornamos uma lista básica de tipos de consulta
      return [
        {
          code: 'C',
          name: 'Consulta',
          ...this.getDefaultErpEntityData(integration),
          data: {
            scheduleType: SpecialityTypes.C,
          },
        },
      ];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listAppointmentTypes', error);
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      // Dados fixos das unidades organizacionais da Stenci
      const organizationUnits = [
        { code: 1, name: 'Eco Medical Center' },
        { code: 2, name: 'ECO - Cardiovascular' },
        { code: 3, name: 'Eco Ortopedia (Artro)' },
        { code: 4, name: 'ECO - Urologia (Urocentro)' },
        { code: 5, name: 'ECO - Endoscopia' },
        { code: 6, name: 'ECO - Fisio (AGMA)' },
        { code: 7, name: 'ECO - Reprodução Humana (Triamare)' },
        { code: 8, name: 'ECO - Oncologia e Eco Centro de Infusões' },
        { code: 9, name: 'ECO - Fonoaudiologia' },
        { code: 10, name: 'ECO - Odontologia e Buco Maxilo' },
        { code: 11, name: 'ECO - Nefrologia (Nefroclínicas)' },
        { code: 12, name: 'Plunes Centro Médico' },
        { code: 13, name: 'ECO - InCórpore' },
      ];

      return organizationUnits.map((unit) => ({
        code: String(unit.code),
        name: unit.name,
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listOrganizationUnits', error);
    }
  }

  public async extractEntity(data: ListValidEntities): Promise<EntityTypes[]> {
    const { filters, integration, targetEntity, cache } = data;
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
        case EntityType.insurance:
          return this.listInsurances(integration, filters);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, filters);

        case EntityType.doctor:
          return this.listProfessionals(integration, filters);

        case EntityType.speciality:
          return this.listSpecialties(integration, filters);

        case EntityType.procedure:
          return this.listProcedures(integration, filters);

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration, filters);

        case EntityType.organizationUnit:
          return this.listOrganizationUnits(integration, filters);

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
