import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  EntityVersionType,
  IDoctorEntity,
  IInsuranceEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  IAppointmentTypeEntity,
  SpecialityTypes,
} from '../../../interfaces/entity.interface';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { InitialPatient } from '../../../integrator/interfaces';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { KonsistApiService } from './konsist-api.service';
import { KonsistHelpersService } from './konsist-helpers.service';
import { EntityFiltersParams } from 'kissbot-health-core';
import * as moment from 'moment';
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
export class KonsistEntitiesService {
  constructor(
    private readonly konsistApiService: KonsistApiService,
    private readonly konsistHelpersService: KonsistHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  /**
   * Retorna dados padrão para entidades do ERP
   */
  public getDefaultErpEntityData(
    integration: IntegrationDocument,
  ): Pick<EntityDocument, 'integrationId' | 'source' | 'activeErp' | 'version'> {
    return {
      integrationId: castObjectId(integration._id),
      source: EntitySourceType.erp,
      activeErp: true,
      version: EntityVersionType.production,
    };
  }

  public async listValidApiEntities(params: ListValidEntities): Promise<EntityDocument[]> {
    const { integration, targetEntity, filters, cache, patient } = params;
    return this.listValidEntities(integration, filters, targetEntity, cache, patient);
  }

  /**
   * Lista entidades válidas da API com cache
   */
  public async listValidEntities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    try {
      const allEntities = await this.extractEntity(integration, targetEntity, filters, cache, patient?.bornDate);
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

      return dbEntities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorEntitiesService.listValidEntities', error);
    }
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

      if (filters.hasOwnProperty(EntityType.insurance) && filters[EntityType.insurance].code !== '-1') {
        params.convenio_id = Number(filters[EntityType.insurance].code);
      }

      params.ativo = 1;

      if (patientBornDate) {
        params.patientAge = moment().diff(patientBornDate, 'years');
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

  /**
   * Extrai entidades da API Konsist
   */
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
            return this.listOrganizationUnits(integration, requestFilters);
          case EntityType.insurance:
            return this.listInsurances(integration, requestFilters);
          case EntityType.doctor:
            return this.listDoctors(integration, requestFilters);
          case EntityType.speciality:
            return this.listSpecialities(integration, requestFilters);
          case EntityType.procedure:
            return this.listProcedures(integration, requestFilters);
          case EntityType.appointmentType:
            return this.listAppointmentTypes(integration, requestFilters);
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

  // ==================== DOCTORS ====================

  /**
   * Lista médicos da API Konsist
   * KonsistMedicoResponse: { id, nome?, crm?, local?, podemarcaratendido? }
   */
  public async listDoctors(integration: IntegrationDocument, filters: CorrelationFilter): Promise<IDoctorEntity[]> {
    try {
      const response = await this.konsistApiService.listDoctors(integration);

      if (!response?.length) {
        return [];
      }

      return response.map((resource) => ({
        code: String(resource.id),
        name: resource.nome?.trim(),
        friendlyName: resource.nome?.trim(),
        ...this.getDefaultErpEntityData(integration),
        data: {
          crm: resource.crm,
          local: resource.local,
          podemarcaratendido: resource.podemarcaratendido,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listDoctors', error);
    }
  }

  // ==================== INSURANCES ====================

  /**
   * Lista convênios da API Konsist
   * KonsistConvenioResponse: { id?, codigo?, nome?, reduzido?, num_cnpj?, status? }
   */
  public async listInsurances(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<IInsuranceEntity[]> {
    try {
      const response = await this.konsistApiService.listInsurances(integration);

      if (!response?.length) {
        return [];
      }

      return response.map((resource) => ({
        code: String(resource.id),
        name: resource.nome?.trim(),
        activeErp: resource.status === 'A' || resource.status === 'ativo',
        ...this.getDefaultErpEntityData(integration),
        data: {
          codigo: resource.codigo,
          reduzido: resource.reduzido,
          cnpj: resource.num_cnpj,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listInsurances', error);
    }
  }

  // ==================== ORGANIZATION UNITS ====================

  /**
   * Lista unidades organizacionais (filiais) da API Konsist
   * KonsistEmpresaResponse: { tipo?, id?, empresa?, cnpj?, endereco?, numero?, bairro?, cep?, ddd?, fone?, site?, localizacao?, complemento? }
   */
  public async listOrganizationUnits(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.konsistApiService.listOrganizationUnits(integration);

      if (!response?.length) {
        return [];
      }

      const entities = response
        .filter((resource) => resource.id && resource.empresa?.trim()?.length)
        .map((resource) => ({
          code: String(resource.id),
          name: resource.empresa?.trim(),
          ...this.getDefaultErpEntityData(integration),
          data: {
            tipo: resource.tipo,
            cnpj: resource.cnpj,
            endereco: resource.endereco,
            numero: resource.numero,
            bairro: resource.bairro,
            cep: resource.cep,
            ddd: resource.ddd,
            fone: resource.fone,
            site: resource.site,
            localizacao: resource.localizacao,
            complemento: resource.complemento,
          },
        }));
      return entities;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listOrganizationUnits', error);
    }
  }
  // ==================== PROCEDURES ====================

  /**
   * Lista procedimentos/serviços da API Konsist
   */
  public async listProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
  ): Promise<IProcedureEntity[]> {
    try {
      let response: any[];

      // Se tem filtro de convênio, busca serviços específicos do convênio
      if (filters?.insurance?.code) {
        response = await this.konsistApiService.listProceduresByInsurance(integration, filters.insurance.code);
      } else {
        response = await this.konsistApiService.listProcedures(integration);
      }

      if (!response?.length) {
        return [];
      }

      return response.map((resource) => ({
        code: String(resource.id || resource.codigo),
        name: resource.nome?.trim() || resource.descricao?.trim(),
        specialityType: SpecialityTypes.C,
        specialityCode: filters?.speciality?.code || '-1',
        ...this.getDefaultErpEntityData(integration),
        data: {
          tipo: resource.tipo,
          valor: resource.valor,
          duracao: resource.duracao,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listProcedures', error);
    }
  }

  // ==================== SPECIALITIES ====================

  /**
   * Lista especialidades da API Konsist
   * Usa endpoint /listarespecialidade se disponível, senão usa lista fixa
   */
  public async listSpecialities(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<ISpecialityEntity[]> {
    try {
      // Tenta buscar especialidades da API
      const response = await this.konsistApiService.listSpecialities(integration);

      if (response?.length) {
        return response.map((resource: any) => ({
          code: String(resource.id || resource.codigo),
          name: resource.nome?.trim() || resource.descricao?.trim(),
          specialityType: SpecialityTypes.C,
          ...this.getDefaultErpEntityData(integration),
        }));
      }

      // Fallback: retorna lista vazia ou especialidade genérica
      return [
        {
          code: 'consulta',
          name: 'Consulta',
          specialityType: SpecialityTypes.C,
          ...this.getDefaultErpEntityData(integration),
        },
      ];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listSpecialities', error);
    }
  }

  // ==================== APPOINTMENT TYPES ====================

  /**
   * Lista tipos de atendimento
   * Konsist usa tipos fixos: Consulta (C) e Exame (E)
   */
  public async listAppointmentTypes(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<IAppointmentTypeEntity[]> {
    try {
      return [
        {
          code: 'C',
          name: 'Consulta',
          ...this.getDefaultErpEntityData(integration),
          params: {
            referenceScheduleType: ScheduleType.Consultation,
          },
        },
        {
          code: 'E',
          name: 'Exame',
          ...this.getDefaultErpEntityData(integration),
          params: {
            referenceScheduleType: ScheduleType.Exam,
          },
        },
      ];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listAppointmentTypes', error);
    }
  }
}
