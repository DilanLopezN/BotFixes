import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { defaultAppointmentTypes } from '../../../entities/default-entities';
import { EntityDocument } from '../../../entities/schema';
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
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import {
  MatrixDoctorParamsRequest,
  MatrixInsurancePlansParamsRequest,
  MatrixOrganizationUnitsParamsRequest,
  MatrixOrganizationUnitsResponse,
  MatrixProceduresParamsRequest,
} from '../interfaces/base-register.interface';
import { MatrixApiService } from './matrix-api.service';
import { InitialPatient } from '../../../integrator/interfaces';
import { MatrixHelpersService } from './matrix-helpers.service';
import { IIntegration } from '../../../integration/interfaces/integration.interface';

type RequestParams = { [key: string]: any };

@Injectable()
export class MatrixEntitiesService {
  constructor(
    private readonly matrixApiService: MatrixApiService,
    private readonly matrixHelpersService: MatrixHelpersService,
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

  private getResourceFilters(integration: IIntegration, _: EntityType, filters: CorrelationFilter): RequestParams {
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

    if (filters.procedure?.code) {
      const procedureData = this.matrixHelpersService.getCompositeProcedureCode(integration, filters.procedure.code);
      params.procedureCode = procedureData.code;
    }

    if (filters.doctor?.code) {
      params.doctorCode = filters.doctor.code;
    }

    return params;
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
      throw INTERNAL_ERROR_THROWER('MatrixEntitiesService.listValidApiEntities', error);
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    params: MatrixOrganizationUnitsParamsRequest,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      let response: MatrixOrganizationUnitsResponse['unidades'];

      if (params?.insuranceCode || params?.specialityCode) {
        response = await this.matrixApiService.listOrganizationUnitsWithParams(integration, {
          convenio_id: params.insuranceCode ?? '',
          plano_id: params.insurancePlanCode ?? '',
          setor_id: params.specialityCode ?? '',
          procedimento_id: params.procedureCode ?? '',
          codigoRegiaoColeta: params.pickUpRegionCode ?? '',
          responsavel_id: params.doctorCode ?? '',
        });
      } else {
        response = await this.matrixApiService.listOrganizationUnits(integration);
      }

      if (!response) {
        return [];
      }

      return Promise.all(
        response.map(async (resource) => {
          const entity: IOrganizationUnitEntity = {
            code: String(resource.unidade_id ?? -1),
            name: String(resource.unidade_nome).trim(),
            data: {
              address: resource.unidade_endereco
                ? `${resource.unidade_endereco}, ${resource.numero}, ${resource.bairro} - ${resource.cep}`
                : '',
            },
            ...this.getDefaultErpEntityData(integration),
          };

          return entity;
        }),
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.listOrganizationUnits', error);
    }
  }

  public async listInsurances(integration: IntegrationDocument): Promise<IInsuranceEntity[]> {
    try {
      const response = await this.matrixApiService.listInsurances(integration);

      return Promise.all(
        response
          ?.filter((resource) => resource.planos?.length)
          .map(async (resource) => {
            const entity = {
              code: String(resource.convenio_id),
              name: String(resource.convenio_nome)?.trim(),
              ...this.getDefaultErpEntityData(integration),
            };
            return entity;
          }),
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.listInsurances', error);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params?: MatrixInsurancePlansParamsRequest,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const response = await this.matrixApiService.listInsurancePlans(integration);
      const insurancePlans: IInsurancePlanEntity[] = [];

      response?.convenios
        .filter((matrixConvenio) =>
          params?.insuranceCode ? params.insuranceCode === String(matrixConvenio.convenio_id) : true,
        )
        .map((matrixConvenio) => {
          matrixConvenio.planos?.forEach((matrixPlano) => {
            insurancePlans.push({
              code: String(matrixPlano.plano_id),
              name: String(matrixPlano.plano_nome)?.trim(),
              insuranceCode: String(matrixConvenio.convenio_id),
              ...this.getDefaultErpEntityData(integration),
            });
          });
        });

      return insurancePlans;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.listInsurancePlans', error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    params: MatrixDoctorParamsRequest,
  ): Promise<IDoctorEntity[]> {
    try {
      const response = await this.matrixApiService.listDoctors(integration, {
        convenio_id: params.insuranceCode ?? '',
        plano_id: params.insurancePlanCode ?? '',
        setor_id: params.specialityCode ?? '',
        procedimento_id: params.procedureCode ?? '',
      });

      return response?.map((resource) => {
        const entity = {
          code: String(resource.responsavel_id),
          name: String(resource.responsavel_nome)?.trim(),
          ...this.getDefaultErpEntityData(integration),
        };

        return entity;
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.listDoctors', error);
    }
  }

  public async listSpecialities(integration: IntegrationDocument): Promise<ISpecialityEntity[]> {
    try {
      const response = await this.matrixApiService.listSpecialities(integration);

      return response
        ?.filter((resource) => (resource.ativo === 'S' && resource.procedimentos.length ? true : false))
        .map((resource) => {
          const entity: ISpecialityEntity = {
            code: String(resource.setor_id),
            name: String(resource.setor_nome)?.trim(),
            specialityType: SpecialityTypes.E,
            ...this.getDefaultErpEntityData(integration),
            activeErp: true,
          };

          return entity;
        });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.listSpecialities', error);
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
      throw INTERNAL_ERROR_THROWER('MatrixService.listAppointmentTypes', error);
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    params: MatrixProceduresParamsRequest,
    patient?: InitialPatient,
    fromImport: boolean = false,
  ): Promise<IProcedureEntity[]> {
    const formatEntity = (resource, lateralityCode: string) => {
      const entity: IProcedureEntity = {
        code: this.matrixHelpersService.createCompositeProcedureCode(
          integration,
          String(resource.procedimento_id),
          String(resource.setor_id),
          null,
          lateralityCode,
        ),
        name: String(resource.procedimento_nome)?.trim(),
        specialityType: SpecialityTypes.E,
        specialityCode: String(resource.setor_id),
        ...this.getDefaultErpEntityData(integration),
        activeErp: !!resource.ativo,
      };

      return entity;
    };

    if (!params?.specialityCode && !fromImport) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        {
          message: `Required specialty filter: ${integration._id}`,
        },
        undefined,
        true,
      );
    }

    const matrixResources = [];

    try {
      if (params.specialityCode) {
        const response = await this.matrixApiService.listProcedures(integration, {
          convenio_id: params.insuranceCode ?? null,
          plano_id: params.insurancePlanCode ?? null,
          setor_id: params.specialityCode,
        });

        matrixResources.push(
          ...(response
            // realiza filtro em memória pois o campo cobertura é o responsável por dizer
            // se o procedimento é atendido por X convênio
            ?.filter((resource) => resource.cobertura !== 'NaoCoberto')
            // realiza filtro em memória pois o campo sexoRestrito realiza o bloqueio de
            // procedimentos pelo sexo. Se for I permite, e M e F realizam o bloqueio
            ?.filter((resource) => {
              if (
                resource.sexoRestrito?.every((sexo) => sexo === 'I') ||
                !resource.sexoRestrito?.length ||
                patient?.sex === 'I'
              ) {
                return true;
              }

              // Sexo tem que chegar neste método, caso não chegue listo apenas procedimentos que não tem restrição
              if (
                !patient?.sex &&
                (!resource.sexoRestrito?.length || resource.sexoRestrito?.every((sexo) => sexo === 'I'))
              ) {
                return true;
              }

              return !resource.sexoRestrito?.includes(patient?.sex);
            }) ?? []),
        );
      } else if (fromImport) {
        const specialties: ISpecialityEntity[] = await this.listSpecialities(integration);

        if (!specialties?.length) {
          throw new HttpException('No specialties found', HttpStatus.BAD_REQUEST);
        }

        for await (const { code: specialityCode } of specialties) {
          const response = await this.matrixApiService.listProcedures(integration, {
            convenio_id: null,
            plano_id: null,
            setor_id: specialityCode,
          });

          matrixResources.push(...(response ?? []));
        }
      }

      const entities: IProcedureEntity[] = [];

      matrixResources.forEach((resource) => {
        if (!resource.regiaoColeta?.length) {
          entities.push(formatEntity(resource, null));
        }

        resource.regiaoColeta?.forEach((coletaResource) => {
          entities.push(formatEntity(resource, coletaResource.codigo));
        });
      });

      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('MatrixService.listProcedures', error);
    }
  }

  public async extractEntity(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters?: CorrelationFilter,
    patient?: InitialPatient,
    cache?: boolean,
    fromImport: boolean = false,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(integration, targetEntity, filters);

    const resourceCacheParams = Object.keys(filters ?? {}).reduce((acc, key) => {
      if (!filters[key]?.code) {
        return acc;
      }
      acc[key] = filters[key].code;
      return acc;
    }, {});

    if (patient?.sex) {
      resourceCacheParams['patientSex'] = patient.sex;
    }

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
          return this.listOrganizationUnits(integration, requestFilters as MatrixOrganizationUnitsParamsRequest);

        case EntityType.insurance:
          return this.listInsurances(integration);

        case EntityType.insurancePlan:
          return this.listInsurancePlans(integration, requestFilters as MatrixInsurancePlansParamsRequest);

        case EntityType.doctor:
          return this.listDoctors(integration, requestFilters as MatrixDoctorParamsRequest);

        case EntityType.speciality:
          return this.listSpecialities(integration);

        case EntityType.procedure:
          return this.listProcedures(integration, requestFilters as MatrixProceduresParamsRequest, patient, fromImport);

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
