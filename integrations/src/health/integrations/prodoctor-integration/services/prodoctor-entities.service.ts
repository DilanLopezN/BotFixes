import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';

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
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import { IntegrationType } from '../../../interfaces/integration-types';
import { ProdoctorApiService } from './prodoctor-api.service';

import { EntityFiltersParams } from 'kissbot-health-core';
import moment from 'moment';
import { IntegrationCacheUtilsService } from '../../../../health/integration-cache-utils/integration-cache-utils.service';

interface ListValidEntities {
  integration: IntegrationDocument;
  targetEntity: EntityType;
  filters: CorrelationFilter;
  cache?: boolean;
  patient?: InitialPatient;
  fromImport?: boolean;
}

type EntityFilters = { [key in EntityType]?: EntityTypes };
type RequestParams = { [key: string]: any };

@Injectable()
export class ProdoctorEntitiesService {
  private readonly logger = new Logger(ProdoctorEntitiesService.name);

  constructor(
    private readonly prodoctorApiService: ProdoctorApiService,
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

  private getResourceFilters(
    targetEntity: EntityType,
    filters: EntityFilters,
    patientBornDate?: string,
  ): RequestParams {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }

    const params: RequestParams = {};

    if (targetEntity === EntityType.procedure) {
      if (filters.hasOwnProperty(EntityType.speciality)) {
        params.especialidade_id = Number(filters[EntityType.speciality].code);
      }

      if (filters.hasOwnProperty(EntityType.appointmentType)) {
        params.tipo_procedimento = Number(filters[EntityType.appointmentType].code);
      }

      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.unidade_id = Number(filters[EntityType.organizationUnit].code);
      }
    }

    if (targetEntity === EntityType.doctor) {
      if (filters.hasOwnProperty(EntityType.speciality)) {
        params.especialidade_id = Number(filters[EntityType.speciality].code);
      }

      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.unidade_id = Number(filters[EntityType.organizationUnit].code);
      }

      // se tiver convenio e não for particular (-1)
      if (filters.hasOwnProperty(EntityType.insurance) && filters[EntityType.insurance].code !== '-1') {
        params.convenio_id = Number(filters[EntityType.insurance].code);
      }

      // está aqui porque pego ativo só para agendar, na extração pega todos para listar histórico
      // dos agendamentos do paciente
      params.ativo = 1;

      if (patientBornDate) {
        params.patientAge = moment().diff(patientBornDate, 'years');
      }
    }

    if (targetEntity.hasOwnProperty(EntityType.speciality)) {
      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.UnitID = Number(filters[EntityType.organizationUnit].code);
      }
    }

    if (targetEntity === EntityType.insurancePlan) {
      if (filters.hasOwnProperty(EntityType.insurance)) {
        params.insurance_id = Number(filters[EntityType.insurance].code);
      }
    }

    if (targetEntity === EntityType.speciality) {
      if (filters.hasOwnProperty(EntityType.organizationUnit)) {
        params.unidade_id = Number(filters[EntityType.organizationUnit].code);
      }
    }
    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilters?: EntityFilters,
    cache?: boolean,
    patientBornDate?: string,
  ): Promise<EntityTypes[]> {
    try {
      const requestFilters = this.getResourceFilters(entityType, rawFilters, patientBornDate);

      if (cache) {
        const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
          entityType,
          integration,
          requestFilters,
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
            return this.listInsurances(integration);

          case EntityType.doctor:
            return this.listDoctors(integration, requestFilters);

          case EntityType.speciality:
            return this.listSpecialities(integration, requestFilters);

          case EntityType.procedure:
            return this.listProcedures(integration, requestFilters);

          case EntityType.appointmentType:
            return this.listAppointmentTypes(integration);

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
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.extractEntity', error);
    }
  }

  /**
   * Lista Locais ProDoctor (Unidades)
   */
  private async listOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.prodoctorApiService.listLocaisProDoctor(integration, { quantidade: 5000 });

      if (!response?.sucesso || !response?.payload?.locaisProDoctor) {
        return [];
      }

      const defaultData = this.getDefaultErpEntityData(integration);

      return response.payload.locaisProDoctor.map((local) => ({
        ...defaultData,
        code: String(local.codigo),
        name: local.nome,
        canSchedule: true,
      }));
    } catch (error) {
      this.logger.error('ProdoctorEntitiesService.listOrganizationUnits', error);
      return [];
    }
  }

  /**
   * Lista Convênios
   */
  private async listInsurances(integration: IntegrationDocument): Promise<IInsuranceEntity[]> {
    try {
      const response = await this.prodoctorApiService.listConvenios(integration, { quantidade: 5000 });

      if (!response?.sucesso || !response?.payload?.convenios) {
        return [];
      }

      const defaultData = this.getDefaultErpEntityData(integration);

      return response.payload.convenios
        .filter((convenio) => convenio.ativo)
        .map((convenio) => ({
          ...defaultData,
          code: String(convenio.codigo),
          name: convenio.nome,
          canSchedule: true,
        }));
    } catch (error) {
      this.logger.error('ProdoctorEntitiesService.listInsurances', error);
      return [];
    }
  }

  /**
   * Lista Médicos/Usuários
   */
  private async listDoctors(integration: IntegrationDocument, filters: CorrelationFilter): Promise<IDoctorEntity[]> {
    try {
      const request: any = { quantidade: 5000 };

      if (filters?.organizationUnit?.code) {
        request.locaisProDoctor = [{ codigo: Number(filters.organizationUnit.code) }];
      }

      const response = await this.prodoctorApiService.listUsuarios(integration, request);

      if (!response?.sucesso || !response?.payload?.usuarios) {
        return [];
      }

      const defaultData = this.getDefaultErpEntityData(integration);

      return response.payload.usuarios
        .filter((usuario) => usuario.ativo)
        .map((usuario) => ({
          ...defaultData,
          code: String(usuario.codigo),
          name: usuario.nome,
          canSchedule: true,
          data: {
            cpf: usuario.cpf,
            crm: usuario.crm,
          },
        }));
    } catch (error) {
      this.logger.error('ProdoctorEntitiesService.listDoctors', error);
      return [];
    }
  }

  /**
   * Lista Especialidades (extraídas dos usuários)
   */
  private async listSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<ISpecialityEntity[]> {
    try {
      const request: any = { quantidade: 5000 };

      if (filters?.organizationUnit?.code) {
        request.locaisProDoctor = [{ codigo: Number(filters.organizationUnit.code) }];
      }

      const response = await this.prodoctorApiService.listUsuariosComEspecialidade(integration, request);

      if (!response?.sucesso || !response?.payload?.usuarios) {
        return [];
      }

      const defaultData = this.getDefaultErpEntityData(integration);
      const specialitiesMap = new Map<number, ISpecialityEntity>();

      for (const usuario of response.payload.usuarios) {
        if (usuario.especialidades?.length) {
          for (const especialidade of usuario.especialidades) {
            if (!specialitiesMap.has(especialidade.codigo)) {
              specialitiesMap.set(especialidade.codigo, {
                ...defaultData,
                code: String(especialidade.codigo),
                name: especialidade.nome,
                canSchedule: true,
                specialityType: SpecialityTypes.C,
              });
            }
          }
        }
      }

      return Array.from(specialitiesMap.values());
    } catch (error) {
      this.logger.error('ProdoctorEntitiesService.listSpecialities', error);
      return [];
    }
  }

  /**
   * Lista Procedimentos
   */
  private async listProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<IProcedureEntity[]> {
    try {
      const request: any = { quantidade: 5000 };

      // Se houver filtro de tabela de procedimentos no data
      if (filters?.procedure?.data?.text) {
        request.tabelas = [{ codigo: Number(filters.procedure.data) }];
      }

      if (filters?.insurance?.code) {
        request.convenios = [{ codigo: Number(filters.insurance.code) }];
      }

      const response = await this.prodoctorApiService.listProcedimentos(integration, request);

      if (!response?.sucesso || !response?.payload?.procedimentos) {
        return [];
      }

      const defaultData = this.getDefaultErpEntityData(integration);

      return response.payload.procedimentos.map((procedimento) => ({
        ...defaultData,
        code: procedimento.codigo,
        name: procedimento.nome,
        canSchedule: true,
        specialityCode: '',
        specialityType: SpecialityTypes.C,
        data: {
          tabela: procedimento.tabela,
          honorario: procedimento.honorario,
        },
      }));
    } catch (error) {
      this.logger.error('ProdoctorEntitiesService.listProcedures', error);
      return [];
    }
  }

  /**
   * Lista Tipos de Agendamento (padrão ProDoctor)
   */
  private listAppointmentTypes(integration: IntegrationDocument): IAppointmentTypeEntity[] {
    const defaultData = this.getDefaultErpEntityData(integration);

    return [
      {
        ...defaultData,
        code: 'consulta',
        name: 'Consulta',
        canSchedule: true,
        params: {
          referenceScheduleType: ScheduleType.Consultation,
        },
      },
      {
        ...defaultData,
        code: 'retorno',
        name: 'Retorno',
        canSchedule: true,
        params: {
          referenceScheduleType: ScheduleType.FollowUp,
        },
      },
      {
        ...defaultData,
        code: 'exame',
        name: 'Exame',
        canSchedule: true,
        params: {
          referenceScheduleType: ScheduleType.Exam,
        },
      },
      {
        ...defaultData,
        code: 'cirurgia',
        name: 'Cirurgia',
        canSchedule: true,
        params: {
          referenceScheduleType: ScheduleType.Consultation,
        },
      },
      {
        ...defaultData,
        code: 'teleconsulta',
        name: 'Teleconsulta',
        canSchedule: true,
        params: {
          referenceScheduleType: ScheduleType.Consultation,
        },
      },
    ];
  }

  /**
   * Busca entidades válidas por filtro
   */
  public async getValidEntitiesByFilter<T extends EntityDocument>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filter: FilterQuery<EntityDocument>,
  ): Promise<T[]> {
    try {
      return (await this.entitiesService.getEntities(targetEntity, filter, integration._id)) as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidEntitiesByFilter', error);
    }
  }

  /**
   * Lista entidades válidas da API
   */
  public async listValidApiEntities(params: ListValidEntities): Promise<EntityDocument[]> {
    const { integration, targetEntity, filters, cache, patient, fromImport } = params;

    try {
      switch (targetEntity) {
        case EntityType.doctor:
          return await this.getValidApiDoctors(integration, filters, cache, patient?.bornDate);

        case EntityType.speciality:
          return await this.getValidApiSpecialities(integration, filters, cache);

        case EntityType.procedure:
          return await this.getValidApiProcedures(integration, filters, cache);

        case EntityType.insurance:
          return await this.getValidApiInsurances(integration, cache);

        case EntityType.insurancePlan:
          return await this.getValidApiInsurancePlans(integration, filters, cache);

        case EntityType.organizationUnit:
          return await this.getValidApiOrganizationUnits(integration, cache);

        case EntityType.appointmentType:
          return await this.getValidApiAppointmentTypes(integration, cache);

        default:
          return await this.entitiesService.getValidEntities(targetEntity, integration._id);
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.listValidApiEntities', error);
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
    patientBornDate?: string,
  ): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.doctor, filters, cache, patientBornDate);
      const codes = entities?.map((doctor) => doctor.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.doctor);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiDoctors', error);
    }
  }

  private async getValidApiSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.speciality, filters, cache);
      const codes = entities?.map((speciality) => speciality.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.speciality);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiSpecialities', error);
    }
  }

  private async getValidApiProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.procedure, filters, cache);
      const codes = entities?.map((procedure) => procedure.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.procedure);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiProcedures', error);
    }
  }

  private async getValidApiInsurances(integration: IntegrationDocument, cache?: boolean): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.insurance, {}, cache);
      const codes = entities?.map((insurance) => insurance.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.insurance);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiInsurances', error);
    }
  }

  private async getValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.insurancePlan, filters, cache);
      const codes = entities?.map((plan) => plan.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.insurancePlan);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiInsurancePlans', error);
    }
  }

  private async getValidApiOrganizationUnits(
    integration: IntegrationDocument,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.organizationUnit, {}, cache);
      const codes = entities?.map((unit) => unit.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.organizationUnit);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiOrganizationUnits', error);
    }
  }

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    try {
      const entities = await this.extractEntity(integration, EntityType.appointmentType, {}, cache);
      const codes = entities?.map((type) => type.code);
      return await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.appointmentType);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.getValidApiAppointmentTypes', error);
    }
  }
}
