import { Injectable, Logger } from '@nestjs/common';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';

import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  EntityVersionType,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  IAppointmentTypeEntity,
  ITypeOfServiceEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { defaultAppointmentTypes } from '../../../entities/default-entities';
import { PhillipsApiService } from './phillips-api.service';
import {
  PhillipsActivePhysician,
  PhillipsInsurance,
  PhillipsMedicalSpecialty,
  PhillipsProcedure,
  PhillipsParamsType,
} from '../interfaces';
import { EntityDocument, ScheduleType } from '../../../../health/entities/schema';
import { FilterQuery } from 'mongoose';
import { EntitiesService } from '../../../../health/entities/services/entities.service';
import { CorrelationFilter } from 'health/interfaces/correlation-filter.interface';

type RequestParams = { [key: string]: any };
const INSURANCES_RAW_CACHE_KEY = 'phillips:insurances:raw';

@Injectable()
export class PhillipsEntitiesService {
  private logger = new Logger(PhillipsEntitiesService.name);

  constructor(
    private readonly apiService: PhillipsApiService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly entitiesService: EntitiesService,
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

  // ========== EXTRACT ENTITY (padrão do projeto) ==========

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters?: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, filters ?? {});

    const resourceCacheParams = Object.keys(filters ?? {}).reduce((acc, key) => {
      acc[key] = filters?.[key]?.code;
      return acc;
    }, {});

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        resourceCacheParams,
      );

      if (!!resourceCache) {
        return resourceCache;
      }
    }

    const getResource = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return this.listOrganizationUnits(integration);

        case EntityType.insurance:
          return this.listInsurances(integration, requestFilters as PhillipsParamsType);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, requestFilters);

        case EntityType.doctor:
          return this.listDoctors(integration, requestFilters as PhillipsParamsType);

        case EntityType.speciality:
          return this.listSpecialities(integration, requestFilters as PhillipsParamsType);

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        case EntityType.procedure:
          return this.listProcedures(integration, requestFilters as PhillipsParamsType);

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await getResource();
    await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
      entityType,
      integration,
      requestFilters,
      resource,
    );
    return resource;
  }

  // ========== LIST VALID API ENTITIES ==========

  public async listValidApiEntities<T>(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const entities = await this.extractEntity(integration, targetEntity, filters, cache);
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

      if (targetEntity === EntityType.insurancePlan && filters?.insurance) {
        customFilters.insuranceCode = filters.insurance.code;
      }

      const validEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        targetEntity,
        customFilters,
      );

      if (cache && validEntities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, validEntities, codes);
      }

      return (validEntities ?? []) as unknown as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listValidApiEntities', error);
    }
  }

  // ========== RESOURCE FILTERS ==========

  private getResourceFilters(targetEntity: EntityType, filters: CorrelationFilter): RequestParams {
    const params: RequestParams = {};

    if (!filters || Object.keys(filters).length === 0) {
      return params;
    }

    // Convênio filtrado por código quando vem da correlação
    if (targetEntity === EntityType.insurance && filters?.[EntityType.organizationUnit]) {
      params.establishmentCode = filters[EntityType.organizationUnit]?.code;
    }

    // Planos de convênio: precisa do código do convênio
    if (targetEntity === EntityType.insurancePlan && filters?.[EntityType.insurance]) {
      params.insuranceCode = filters[EntityType.insurance]?.code;
    }

    // Especialidades: pode filtrar por scheduleCode ou schedulePhysicianCode
    if (targetEntity === EntityType.speciality && filters?.[EntityType.doctor]) {
      params.schedulePhysicianCode = filters[EntityType.doctor]?.code;
    }

    if (targetEntity === EntityType.procedure) {
      if (filters?.[EntityType.procedure]) {
        params.codeId = filters[EntityType.procedure]?.code;
      }
    }

    if (filters?.[EntityType.appointmentType]) {
      const scheduleType = filters[EntityType.appointmentType]?.params?.referenceScheduleType;
      if (scheduleType === ScheduleType.Exam) {
        params['type-of-procedure'] = 'OTHER_EXAMS';
      }
    }

    return params;
  }

  // ========== ORGANIZATION UNITS (ESTABLISHMENTS) ==========
  // A3 - GET /api/establishments/actives

  private async listOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const defaultData = this.getDefaultErpEntityData(integration);

      return [
        {
          ...defaultData,
          code: '1',
          name: 'Pompéia Ecossistema de Saúde',
        },
      ];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listOrganizationUnits', error);
    }
  }

  // ========== FETCH RAW INSURANCES (com cache Redis) ==========
  // Busca os dados raw de convênios da API e cacheia no Redis
  // Reutilizado tanto por listInsurances quanto por listInsurancePlans

  private async fetchRawInsurances(
    integration: IntegrationDocument,
    requestFilters?: PhillipsParamsType,
  ): Promise<PhillipsInsurance[]> {
    // Tenta buscar do cache primeiro
    const cacheKey = `${INSURANCES_RAW_CACHE_KEY}:${integration._id}`;
    const cached = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
      EntityType.insurance,
      integration,
      { _rawInsurances: 'all', ...requestFilters },
    );

    if (cached?.length) {
      return cached as unknown as PhillipsInsurance[];
    }

    // Busca da API
    const data = await this.apiService.listInsurances(integration, requestFilters);
    const insurances: PhillipsInsurance[] = Array.isArray(data) ? data : data ? [data] : [];

    // Cacheia os dados raw para reutilização pelos planos
    if (insurances?.length) {
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        EntityType.insurance,
        integration,
        { _rawInsurances: 'all', ...requestFilters },
        insurances as unknown as EntityTypes[],
      );
    }

    return insurances;
  }

  // ========== INSURANCES ==========
  // A5 - GET /api/insurances/insuranceCode?insuranceCode=X

  private async listInsurances(
    integration: IntegrationDocument,
    requestFilters: PhillipsParamsType,
  ): Promise<IInsuranceEntity[]> {
    try {
      const insurances = await this.fetchRawInsurances(integration, requestFilters);

      const entities = insurances?.map((resource: PhillipsInsurance) => {
        const entity: IInsuranceEntity = {
          code: String(resource.insuranceCode),
          name: resource.insuranceDescription?.trim(),
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listInsurances', error);
    }
  }

  // ========== SPECIALITIES ==========
  // A4 - GET /api/medicalSpecialties/actives

  private async listSpecialities(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.apiService.getSpecialities(
        integration,
        Object.keys(requestFilters).length ? requestFilters : undefined,
      );

      const entities = data?.map((resource: PhillipsMedicalSpecialty) => {
        const entity: ISpecialityEntity = {
          code: String(resource.code),
          name: resource.specialty?.trim(),
          specialityType: SpecialityTypes.C,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listSpecialities', error);
    }
  }

  // ========== DOCTORS (PHYSICIANS) ==========
  // A6 - GET /api/schedules/integrated-schedule/active-physicians/
  // API paginada - busca todas as páginas

  private async listDoctors(integration: IntegrationDocument, requestFilters: RequestParams): Promise<IDoctorEntity[]> {
    try {
      let page = 1;
      const apiEntities: PhillipsActivePhysician[] = [];
      let response: PhillipsActivePhysician[];

      do {
        response = await this.apiService.getDoctors(integration, {
          page,
          maxResults: 100,
          ...requestFilters,
        });

        if (response?.length > 0) {
          apiEntities.push(...response);
        }

        page++;
      } while (response?.length >= 100 && page < 20);

      const entities = apiEntities
        ?.filter((resource) => resource.physicianIsActive === 'A')
        .map((resource) => {
          const entity: IDoctorEntity = {
            code: String(resource.physicianCode),
            name: resource.physicianName?.trim(),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listDoctors', error);
    }
  }

  // ========== PROCEDURES ==========
  // A9 - GET /api/internalProcedures/actives
  // API paginada - busca todas as páginas

  private async listProcedures(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IProcedureEntity[]> {
    try {
      let page = 1;
      const apiEntities: PhillipsProcedure[] = [];
      let response: PhillipsProcedure[];

      do {
        const result = await this.apiService.getProcedures(integration, {
          page,
          maxResults: 100,
          ...requestFilters,
        });

        response = result?.internalProcedures || [];

        if (response?.length > 0) {
          apiEntities.push(...response);
        }

        page++;
      } while (response?.length >= 100 && page < 20);

      const entities = apiEntities
        ?.filter((resource) => resource.status === 'ACTIVE')
        .map((resource) => {
          const entity: IProcedureEntity = {
            code: String(resource.internalSequence),
            name: resource.descriptionExamProcedure?.trim(),
            specialityCode: resource.dsClassification ? String(resource.dsClassification.numberSequence) : '-1',
            specialityType: resource.typeOfProcedure === 'OTHER_EXAMS' ? SpecialityTypes.E : SpecialityTypes.C,
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listProcedures', error);
    }
  }

  // ========== INSURANCE PLANS ==========
  // Extraídos de insuranceCategoryEntity do retorno de listInsurances
  // Reutiliza o cache raw de convênios para não fazer request duplicada

  private async listInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const insuranceCode = requestFilters?.insuranceCode;

      // Busca convênios do cache/API
      const insurances = await this.fetchRawInsurances(integration);

      // Filtra pelo convênio específico se informado
      const filteredInsurances = insuranceCode
        ? insurances.filter((ins) => String(ins.insuranceCode) === String(insuranceCode))
        : insurances;

      const entities: IInsurancePlanEntity[] = [];

      for (const insurance of filteredInsurances) {
        const categories = insurance.insuranceCategoryEntity ?? [];

        for (const category of categories) {
          if (category.status !== 'ACTIVE') continue;

          const entity: IInsurancePlanEntity = {
            code: `${insurance.insuranceCode}_${category.category}`,
            name: category.categoryDescription?.trim(),
            insuranceCode: String(insurance.insuranceCode),
            ...this.getDefaultErpEntityData(integration),
          };

          entities.push(entity);
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listInsurancePlans', error);
    }
  }

  // ========== APPOINTMENT TYPES ==========
  // Sem endpoint específico - utiliza defaults (consulta/exame)

  private async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return defaultAppointmentTypes.map((resource) => ({
        ...resource,
        ...this.getDefaultErpEntityData(integration),
      })) as IAppointmentTypeEntity[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listAppointmentTypes', error);
    }
  }

  // ========== TYPE OF SERVICES ==========

  private async listTypeOfServices(integration: IntegrationDocument): Promise<ITypeOfServiceEntity[]> {
    throw INTERNAL_ERROR_THROWER('PhillipsEntitiesService.listTypeOfServices', 'Not implemented');
  }
}
