import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { defaultTypesOfService } from '../../../entities/default-entities';
import { AppointmentTypeEntityDocument, ScheduleType, EntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
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
  ITypeOfServiceEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import {
  ManagerDoctorsParamsRequest,
  ManagerInsurancePlansParamsRequest,
  ManagerInsurancesParamsRequest,
  ManagerProceduresExamsParamsRequest,
  ManagerProceduresParamsRequest,
  ManagerSpecialitiesExamsParamsRequest,
  ManagerSpecialitiesParamsRequest,
  ManagerSpecialitiesResponse,
} from '../interfaces';
import { ManagerApiService } from './manager-api.service';
import { ManagerHelpersService } from './manager-helpers.service';

type RequestParams = { [key: string]: any };

@Injectable()
export class ManagerEntitiesService {
  constructor(
    private readonly managerApiService: ManagerApiService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly managerHelpersService: ManagerHelpersService,
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

  public async listOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.managerApiService.listOrganizationUnits(integration);
      const entities = data?.map((resource) => {
        const entity: IOrganizationUnitEntity = {
          code: String(resource.handle),
          name: resource.nome,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listOrganizationUnits', error);
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    filters: ManagerInsurancesParamsRequest,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.managerApiService.listInsurances(integration, filters);
      const entities = data?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: String(resource.handle),
          name: resource.nome,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listInsurances', error);
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    requestFilters: ManagerSpecialitiesParamsRequest | ManagerSpecialitiesExamsParamsRequest,
    filters: CorrelationFilter,
  ): Promise<ISpecialityEntity[]> {
    try {
      let data: ManagerSpecialitiesResponse[] = [];

      if (filters?.appointmentType?.code) {
        if (filters.appointmentType?.params?.referenceScheduleType === ScheduleType.Exam) {
          data = await this.managerApiService.listProceduresExamsGroups(
            integration,
            requestFilters as ManagerSpecialitiesExamsParamsRequest,
          );
        } else {
          data = await this.managerApiService.listSpecialities(
            integration,
            requestFilters as ManagerSpecialitiesParamsRequest,
          );
        }
      } else {
        // se não tem appointmentType possivelmente é uma importação
        const responses = await Promise.all([
          this.managerApiService.listProceduresExamsGroups(
            integration,
            requestFilters as ManagerSpecialitiesExamsParamsRequest,
          ),
          this.managerApiService.listSpecialities(integration, requestFilters as ManagerSpecialitiesParamsRequest),
        ]);

        responses.map((response) => {
          data = [...data, ...response];
        });
      }

      const entities = data?.map((resource) => {
        const entity: ISpecialityEntity = {
          code: String(resource.handle),
          name: resource.nome,
          specialityType: SpecialityTypes.C,
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listSpecialities', error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    filters: ManagerInsurancePlansParamsRequest,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      // se possui filtro ja filtra na request o convenio
      if (filters.convenio) {
        const data = await this.managerApiService.listInsurancePlans(integration, filters);
        const entities = data?.map((resource) => {
          const entity: IInsurancePlanEntity = {
            code: String(resource.handle),
            name: resource.nome,
            insuranceCode: String(filters.convenio),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

        return entities ?? [];
      }
      // aqui é no caso da importação de dados que preciso vincular o convenio ao plano
      const insurances = await this.managerApiService.listInsurances(integration, {});

      if (!insurances.length) {
        return [];
      }

      const entities: IInsurancePlanEntity[] = [];

      for await (const insurance of insurances) {
        filters.convenio = insurance.handle;
        const insurancePlans = await this.managerApiService.listInsurancePlans(integration, filters);

        if (insurancePlans.length) {
          for await (const insurancePlan of insurancePlans) {
            const entity: IInsurancePlanEntity = {
              code: String(insurancePlan.handle),
              name: insurancePlan.nome,
              insuranceCode: String(filters.convenio),
              ...this.getDefaultErpEntityData(integration),
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listInsurancePlans', error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    filters: ManagerDoctorsParamsRequest,
  ): Promise<IDoctorEntity[]> {
    try {
      if (filters?.unidadeFilial) {
        const data = await this.managerApiService.listDoctors(integration, filters);
        const entities = data?.map((resource) => {
          const entity: IDoctorEntity = {
            code: String(resource.handle),
            name: resource.nome,
            ...this.getDefaultErpEntityData(integration),
            activeErp: resource.disponivelWeb,
            data: {
              type: resource.tipo,
              crm: resource.crm,
              unidadeFilial: filters?.unidadeFilial || null,
            },
          };

          return entity;
        });

        return entities ?? [];
      }

      const entities: IDoctorEntity[] = [];
      const organizationUnits = await this.entitiesService.getActiveEntities(
        EntityType.organizationUnit,
        null,
        integration._id,
      );

      for await (const organizationUnit of organizationUnits) {
        filters.unidadeFilial = Number(organizationUnit.code);
        const doctors = await this.managerApiService.listDoctors(integration, filters);

        if (doctors.length) {
          for await (const resource of doctors) {
            const entity: IDoctorEntity = {
              code: String(resource.handle),
              name: resource.nome,
              ...this.getDefaultErpEntityData(integration),
              activeErp: resource.disponivelWeb,
              data: {
                type: resource.tipo,
                crm: resource.crm,
                unidadeFilial: filters.unidadeFilial || null,
              },
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listDoctors', error);
    }
  }

  private resolveProceduresRequest(
    integration: IntegrationDocument,
    requestFilters: ManagerProceduresParamsRequest & ManagerProceduresExamsParamsRequest,
    filters: CorrelationFilter = {},
  ) {
    if (filters.appointmentType?.params.referenceScheduleType === ScheduleType.Exam) {
      return this.managerApiService.listProceduresExams(integration, {
        convenio: requestFilters.convenio,
        grupoServico1: requestFilters.grupoServico1,
        plano: requestFilters.plano,
      } as ManagerProceduresExamsParamsRequest);
    }

    return this.managerApiService.listProcedures(integration, {
      convenio: requestFilters.convenio,
      especialidade: requestFilters.especialidade,
      tipoServico: requestFilters.tipoServico,
      plano: requestFilters.plano,
    } as ManagerProceduresParamsRequest);
  }

  public async resolveListProcedures(
    integration: IntegrationDocument,
    requestFilters: ManagerProceduresParamsRequest & ManagerProceduresExamsParamsRequest,
    filters: CorrelationFilter = {},
  ): Promise<IProcedureEntity[]> {
    const validFilters = filters.insurance?.code && filters.speciality?.code && filters.appointmentType?.code;

    if (validFilters) {
      const data = await this.resolveProceduresRequest(integration, requestFilters, filters);
      const entities = data?.map((resource) => {
        const entity: IProcedureEntity = {
          code: String(resource.handle),
          name: resource.nomeWeb,
          specialityType: filters.appointmentType.params.referenceScheduleType,
          specialityCode: String(filters.speciality.code),
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    }

    const entitiesMap: { [key: string]: IProcedureEntity } = {};

    const appointmentTypes = (await this.extractEntity(
      integration,
      EntityType.appointmentType,
      {},
      false,
    )) as AppointmentTypeEntityDocument[];
    let insurances = await this.listInsurances(integration, {});

    // Extração demora demais na usuy, então fixei 2 unicos convênios que retornam dados diferentes
    if (['63c88e97ab14450008b608e4', '63e306ee69c19b340cf5004b'].includes(castObjectIdToString(integration._id))) {
      insurances = insurances.filter((insurance) => insurance.code === '98' || insurance.code === '5000317');
    }

    // gastroclinica
    if (['6320c8853cfa7f0008a1bcff', '638502155c87d1073040a503'].includes(castObjectIdToString(integration._id))) {
      insurances = insurances.filter((insurance) => insurance.code === '26');
    }

    for (const appointmentType of appointmentTypes) {
      filters.appointmentType = appointmentType;

      const specialities = await this.listSpecialities(integration, {}, filters);
      for (const insurance of insurances) {
        for (const speciality of specialities) {
          const data = await this.resolveProceduresRequest(
            integration,
            {
              convenio: Number(insurance.code),
              especialidade: Number(speciality.code),
              tipoServico: appointmentType.code,
              grupoServico1: Number(speciality.code),
            },
            filters,
          );

          for (const procedure of data) {
            if (!entitiesMap[procedure.handle]) {
              const entity: IProcedureEntity = {
                code: String(procedure.handle),
                name: procedure.nomeWeb,
                specialityType: appointmentType.params.referenceScheduleType,
                specialityCode: speciality.code,
                ...this.getDefaultErpEntityData(integration),
              };

              entitiesMap[procedure.handle] = entity;
            }
          }
        }
      }
    }

    return Object.values(entitiesMap);
  }

  public async listProcedures(
    integration: IntegrationDocument,
    requestFilters: ManagerProceduresParamsRequest & ManagerProceduresExamsParamsRequest,
    filters: CorrelationFilter,
  ): Promise<IProcedureEntity[]> {
    try {
      return await this.resolveListProcedures(integration, requestFilters, filters);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listProcedures', error);
    }
  }

  public async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    const scheduleTypeMap = {
      ['P']: ScheduleType.Exam,
      ['R']: ScheduleType.FollowUp,
      ['C']: ScheduleType.Consultation,
    };

    try {
      const data = await this.managerApiService.listAppointmentTypes(integration);
      const entities = data?.map((resource) => {
        const entity: IAppointmentTypeEntity = {
          code: String(resource.tipo),
          name: resource.nome,
          ...this.getDefaultErpEntityData(integration),
          params: {
            referenceScheduleType: scheduleTypeMap[resource.tipo],
          },
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listAppointmentTypes', error);
    }
  }

  public async listTypeOfServices(integration: IntegrationDocument): Promise<ITypeOfServiceEntity[]> {
    try {
      return (
        defaultTypesOfService?.map((resource) => ({
          code: resource.code,
          name: resource.name?.trim(),
          ...this.getDefaultErpEntityData(integration),
          params: {
            ...resource.params,
          },
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.getTypeOfServices', error);
    }
  }

  public async listValidApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const data = await this.extractEntity(integration, targetEntity, filters, cache);
      const codes = data?.map((insurance) => insurance.code);

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
      throw INTERNAL_ERROR_THROWER('ManagerEntitiesService.listValidApiEntities', error);
    }
  }

  private async getResourceFilters(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
  ): Promise<RequestParams> {
    if (!Object.keys(filters ?? {}).length) {
      return {};
    }

    const params: RequestParams = {};

    if (filters[EntityType.organizationUnit]) {
      if (targetEntity === EntityType.insurance || targetEntity === EntityType.doctor) {
        params.unidadeFilial = filters[EntityType.organizationUnit].code;
      }

      if (targetEntity === EntityType.speciality) {
        params.unidadesFiliais = filters[EntityType.organizationUnit].code;
      }
    }

    if (!filters[EntityType.organizationUnit] && targetEntity === EntityType.speciality) {
      const organizationUnits = await this.managerHelpersService.listActiveOrganizationUnits(integration);
      params.unidadesFiliais = organizationUnits.map((orgUnit) => orgUnit.code).join(',');
    }

    if (filters[EntityType.appointmentType]) {
      if (targetEntity === EntityType.insurance) {
        params.tipoAgendamento = filters[EntityType.appointmentType].code;
      }

      if (targetEntity === EntityType.procedure) {
        params.tipoServico = filters[EntityType.appointmentType].code;
      }
    }

    if (filters[EntityType.insurance]) {
      if (
        targetEntity === EntityType.insurancePlan ||
        targetEntity === EntityType.speciality ||
        targetEntity === EntityType.procedure ||
        targetEntity === EntityType.doctor
      ) {
        params.convenio = filters[EntityType.insurance].code;
      }
    }

    if (filters[EntityType.insurancePlan]) {
      if (
        targetEntity === EntityType.speciality ||
        targetEntity === EntityType.procedure ||
        targetEntity === EntityType.doctor
      ) {
        params.plano = filters[EntityType.insurancePlan].code;
      }
    }

    if (filters[EntityType.speciality]) {
      if (
        targetEntity === EntityType.procedure &&
        filters[EntityType.appointmentType].params.referenceScheduleType === ScheduleType.Exam
      ) {
        params.grupoServico1 = filters[EntityType.speciality].code;
      } else if (targetEntity === EntityType.procedure || targetEntity === EntityType.doctor) {
        params.especialidade = filters[EntityType.speciality].code;
      }
    }

    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters?: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = await this.getResourceFilters(integration, entityType, filters);
    const resourceCacheParams = Object.keys(filters ?? {}).reduce((acc, key) => {
      acc[key] = filters[key].code;
      return acc;
    }, {});

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
          return this.listOrganizationUnits(integration);

        case EntityType.insurance:
          return this.listInsurances(integration, requestFilters as ManagerInsurancesParamsRequest);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, requestFilters as ManagerInsurancePlansParamsRequest);

        case EntityType.doctor:
          return this.listDoctors(integration, requestFilters as ManagerDoctorsParamsRequest);

        case EntityType.speciality:
          return this.listSpecialities(integration, requestFilters as ManagerSpecialitiesParamsRequest, filters);

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        case EntityType.typeOfService:
          return this.listTypeOfServices(integration);

        case EntityType.procedure:
          return this.listProcedures(integration, requestFilters as ManagerProceduresParamsRequest, filters);

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
