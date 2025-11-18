import { Injectable } from '@nestjs/common';
import { DrMobileApiService } from './dr-mobile-api.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  EntityVersionType,
  IAppointmentTypeEntity,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IInsuranceSubPlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { EntityDocument } from '../../../entities/schema';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import {
  DrMobileInsurancePlansParamsRequest,
  DrMobileOrganizationUnitsParamsRequest,
  DrMobileInsuranceSubPlansParamsRequest,
  DrMobileDoctorsByUnitParamsRequest,
  DrMobileProceduresParamsRequest,
} from '../interfaces/base-register.interface';
import { defaultAppointmentTypes } from '../../../entities/default-entities';
import { FilterQuery } from 'mongoose';
import { DrMobileHelpersService } from './dr-mobile-helpers.service';

type RequestParams = { [key: string]: any };

@Injectable()
export class DrMobileEntitiesService {
  constructor(
    private readonly drMobileApiService: DrMobileApiService,
    private readonly drMobileHelpersService: DrMobileHelpersService,
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

  private getResourceFilters(_: EntityType, filters: CorrelationFilter): RequestParams {
    if (!Object.keys(filters ?? {}).length) {
      return {};
    }

    const params: RequestParams = {};

    if (filters.speciality?.code) {
      params.specialityCode = filters.speciality.code;
    }

    if (filters.insurance?.code) {
      params.insuranceCode = filters.insurance.code;
    }

    if (filters.insurancePlan?.code) {
      params.insurancePlanCode = filters.insurancePlan.code;
    }

    if (filters.organizationUnit?.code) {
      params.organizationUnitCode = filters.organizationUnit.code;
    }

    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters?: CorrelationFilter,
    cache?: boolean,
    fromExtract?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, filters);
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
          return this.listOrganizationUnits(
            integration,
            requestFilters as DrMobileOrganizationUnitsParamsRequest,
            fromExtract,
          );

        case EntityType.insurance:
          return this.listInsurances(integration);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(
            integration,
            requestFilters as DrMobileInsurancePlansParamsRequest,
            fromExtract,
          );

        case EntityType.insuranceSubPlan:
          return this.listInsuranceSubPlans(
            integration,
            requestFilters as DrMobileInsuranceSubPlansParamsRequest,
            fromExtract,
          );

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        case EntityType.speciality:
          return this.listSpecialities(integration);

        case EntityType.procedure:
          return this.listProcedures(integration, requestFilters as DrMobileProceduresParamsRequest, fromExtract);

        case EntityType.doctor:
          return this.listDoctors(integration, requestFilters as DrMobileDoctorsByUnitParamsRequest);

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

  public async listValidApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const data = await this.extractEntity(integration, targetEntity, filters, cache);
      const codes = data?.map((entity) => entity.code);

      if (targetEntity === EntityType.insurancePlan && filters?.insurance) {
        codes.push(filters.insurance.code);
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

      // Na rota de médicos com especialidade retorna menos médicos do que médicos por especialidade e unidade e convenio
      // Então retorno o que veio da api, considerando que se já estiver salvo do nosso lado considero os filtros
      if (targetEntity === EntityType.doctor) {
        const entities = await this.entitiesService.getCollection(EntityType.doctor).find({
          integrationId: castObjectId(integration._id),
          $and: [
            {
              $or: [
                { code: { $in: [...codes] } },
                {
                  source: EntitySourceType.user,
                },
              ],
            },
            { $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }] },
          ],
        });

        const validEntities: T[] = [];

        data?.forEach((drMobileDoctor) => {
          const savedDoctor = entities.find((doctor) => doctor.code === drMobileDoctor.code);

          if (savedDoctor && savedDoctor.canView) {
            validEntities.push(savedDoctor as T);
          } else if (!savedDoctor) {
            validEntities.push({
              ...(drMobileDoctor as T),
              order: -1,
            });
          }
        });

        return validEntities;
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
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listValidApiEntities', error);
    }
  }

  private async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return defaultAppointmentTypes.map((resource) => {
        const entity: IAppointmentTypeEntity = {
          code: resource.code,
          integrationId: castObjectId(integration._id),
          name: resource.name,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          params: {
            ...resource.params,
          },
        };

        return entity;
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listAppointmentTypes', error);
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    filters: DrMobileOrganizationUnitsParamsRequest,
    canImportWithoutRelation?: boolean,
  ): Promise<IOrganizationUnitEntity[]> {
    if (!canImportWithoutRelation && !filters.specialityCode) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listOrganizationUnits', {
        message: 'Não é possível listar unidades sem informar código de especialidade',
      });
    }

    try {
      if (filters.specialityCode) {
        const data = await this.drMobileApiService.listOrganizationUnits(integration, filters);
        const entities = data?.map((resource) => {
          const entity: IOrganizationUnitEntity = {
            code: String(resource.cd_unidade_atendimento),
            name: resource.ds_unidade_atendimento?.trim(),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

        return entities ?? [];
      }

      const specialities = await this.drMobileApiService.listSpecialities(integration);

      if (!specialities?.length) {
        return [];
      }

      const entities: IOrganizationUnitEntity[] = [];

      for await (const speciality of specialities) {
        filters.specialityCode = String(speciality.codigo_servico);
        const organizationUnits = await this.drMobileApiService.listOrganizationUnits(integration, filters);

        if (organizationUnits.length) {
          for await (const organizationUnity of organizationUnits) {
            const entity: IOrganizationUnitEntity = {
              code: String(organizationUnity.cd_unidade_atendimento),
              name: organizationUnity.ds_unidade_atendimento?.trim(),
              ...this.getDefaultErpEntityData(integration),
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listOrganizationUnits', error);
    }
  }

  public async listSpecialities(integration: IntegrationDocument): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.drMobileApiService.listSpecialities(integration);
      const entities = data?.map((resource) => {
        const entity: ISpecialityEntity = {
          code: String(resource.codigo_servico),
          name: resource.descricao_servico?.trim(),
          specialityType: 'C',
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listSpecialities', error);
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    params: DrMobileProceduresParamsRequest,
    canImportWithoutRelation: boolean,
  ): Promise<IProcedureEntity[]> {
    if (!canImportWithoutRelation && !params.specialityCode) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listProcedures', {
        message: 'Não é possível listar procedimentos sem informar código de especialidade',
      });
    }

    try {
      if (params.specialityCode) {
        const data = await this.drMobileApiService.listProcedures(integration, params);
        const entities = data?.map((resource) => {
          const entity: IProcedureEntity = {
            code: this.drMobileHelpersService.createCompositeProcedureCode(
              String(resource.codigo_item),
              String(params.specialityCode),
              SpecialityTypes.C,
            ),
            name: resource.descricao_item?.trim(),
            specialityType: SpecialityTypes.C,
            specialityCode: String(params.specialityCode),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

        return entities ?? [];
      }

      const entities: IProcedureEntity[] = [];
      const specialities = await this.drMobileApiService.listSpecialities(integration);

      for await (const speciality of specialities) {
        params.specialityCode = String(speciality.codigo_servico);

        const procedures = await this.drMobileApiService.listProcedures(integration, params);
        procedures?.map((resource) => {
          const entity: IProcedureEntity = {
            code: this.drMobileHelpersService.createCompositeProcedureCode(
              String(resource.codigo_item),
              String(params.specialityCode),
              SpecialityTypes.C,
            ),
            name: resource.descricao_item?.trim(),
            specialityType: SpecialityTypes.C,
            specialityCode: String(params.specialityCode),
            ...this.getDefaultErpEntityData(integration),
          };

          entities.push(entity);
        });
      }
      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listProcedures', error);
    }
  }

  public async listInsurances(integration: IntegrationDocument): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.drMobileApiService.listInsurances(integration);
      const entities = data?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: String(resource.codigo_convenio),
          name: resource.nome_convenio?.trim(),
          activeErp: resource.sn_ativo === 'S',
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listInsurances', error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params: DrMobileInsurancePlansParamsRequest,
    canImportWithoutRelation: boolean,
  ): Promise<IInsurancePlanEntity[]> {
    if (!canImportWithoutRelation && !params.insuranceCode) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listInsurancePlans', {
        message: 'Não é possível listar planos sem informar código do convênio',
      });
    }

    try {
      if (params.insuranceCode) {
        const data = await this.drMobileApiService.listInsurancePlans(integration, params);

        const entities = data?.map((resource) => {
          const entity: IInsurancePlanEntity = {
            code: String(resource.codigo_plano),
            name: resource.descricao_plano?.trim(),
            insuranceCode: String(params.insuranceCode),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

        return entities ?? [];
      }

      const insurances = await this.drMobileApiService.listInsurances(integration);

      if (!insurances.length) {
        return [];
      }

      const entities: IInsurancePlanEntity[] = [];

      for await (const insurance of insurances) {
        params.insuranceCode = String(insurance.codigo_convenio);
        const insurancePlans = await this.drMobileApiService.listInsurancePlans(integration, params);

        if (insurancePlans.length) {
          for await (const insurancePlan of insurancePlans) {
            const entity: IInsurancePlanEntity = {
              code: String(insurancePlan.codigo_plano),
              name: insurancePlan.descricao_plano?.trim(),
              insuranceCode: String(params.insuranceCode),
              ...this.getDefaultErpEntityData(integration),
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listInsurancePlans', error);
    }
  }

  public async listInsuranceSubPlans(
    integration: IntegrationDocument,
    params: DrMobileInsuranceSubPlansParamsRequest,
    canImportWithoutRelation: boolean,
  ): Promise<IInsuranceSubPlanEntity[]> {
    if (!canImportWithoutRelation && (!params.insuranceCode || !params.insuranePlanCode)) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listInsuranceSubPlans', {
        message: 'Não é possível listar subplanos sem informar código do convênio e plano',
      });
    }

    try {
      if (params.insuranceCode && params.insuranePlanCode) {
        const data = await this.drMobileApiService.listInsuranceSubPlans(integration, params);
        const entities = data?.map((resource) => {
          const entity: IInsuranceSubPlanEntity = {
            code: String(resource.codigo_sub_plano),
            name: resource.descricao_sub_plano?.trim(),
            insuranceCode: String(params.insuranceCode),
            insurancePlanCode: String(params.insuranePlanCode),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

        return entities ?? [];
      }

      const insurances = await this.drMobileApiService.listInsurances(integration);

      if (!insurances.length) {
        return [];
      }

      const entities: IInsuranceSubPlanEntity[] = [];

      for await (const insurance of insurances) {
        params.insuranceCode = String(insurance.codigo_convenio);
        const insurancePlans = await this.drMobileApiService.listInsurancePlans(integration, params);

        for await (const insurancePlan of insurancePlans) {
          params.insuranceCode = String(insurancePlan.codigo_plano);
          const insuranceSubPlans = await this.drMobileApiService.listInsuranceSubPlans(integration, params);

          for await (const insuranceSubPlan of insuranceSubPlans) {
            const entity: IInsuranceSubPlanEntity = {
              code: String(insuranceSubPlan.codigo_sub_plano),
              name: insuranceSubPlan.descricao_sub_plano?.trim(),
              insuranceCode: String(params.insuranceCode),
              insurancePlanCode: String(params.insuranePlanCode),
              ...this.getDefaultErpEntityData(integration),
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listInsuranceSubPlans', error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    filters: DrMobileDoctorsByUnitParamsRequest,
  ): Promise<IDoctorEntity[]> {
    try {
      if (filters.specialityCode && filters.organizationUnitCode && filters.insuranceCode) {
        const data = await this.drMobileApiService.listDoctorsByUnit(integration, filters);
        const entities = data?.map((resource) => {
          const entity: IDoctorEntity = {
            code: String(resource.cdPrestador),
            name: resource.nmPrestador?.trim(),
            friendlyName: resource.nmPrestador?.trim(),
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        });

        return entities ?? [];
      }

      const specialities = await this.drMobileApiService.listSpecialities(integration);

      if (!specialities?.length) {
        return [];
      }

      const entities: IDoctorEntity[] = [];

      for await (const speciality of specialities) {
        filters.specialityCode = String(speciality.codigo_servico);
        const doctors = await this.drMobileApiService.listDoctors(integration, filters);

        if (doctors?.length) {
          for await (const doctor of doctors) {
            const entity: IDoctorEntity = {
              code: String(doctor.cdPrestador),
              name: doctor.nmPrestador?.trim(),
              ...this.getDefaultErpEntityData(integration),
            };

            entities.push(entity);
          }
        }
      }

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileEntitiesService.listDoctors', error);
    }
  }
}
