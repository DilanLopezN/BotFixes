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

  /**
   * Monta filtros de request baseado no tipo de entidade
   */
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
   * Extrai entidades da API Konsist - Assinatura igual ao ProDoctor
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
   * Lista entidades válidas - Assinatura igual ao ProDoctor
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
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listValidEntities', error);
    }
  }

  /**
   * Lista entidades válidas da API (wrapper para compatibilidade)
   */
  public async listValidApiEntities(params: ListValidEntities): Promise<EntityDocument[]> {
    const { integration, targetEntity, filters, cache, patient } = params;
    return this.listValidEntities(integration, filters, targetEntity, cache, patient);
  }

  // ==================== DOCTORS ====================

  private async listDoctors(integration: IntegrationDocument, filters: RequestParams): Promise<IDoctorEntity[]> {
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

  private async listInsurances(integration: IntegrationDocument): Promise<IInsuranceEntity[]> {
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

  private async listOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.konsistApiService.listOrganizationUnits(integration);

      if (!response?.length) {
        return [];
      }

      return response
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
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listOrganizationUnits', error);
    }
  }

  // ==================== PROCEDURES ====================

  private async listProcedures(integration: IntegrationDocument, filters: RequestParams): Promise<IProcedureEntity[]> {
    try {
      let response: any[];

      if (filters?.convenio_id) {
        response = await this.konsistApiService.listProceduresByInsurance(integration, String(filters.convenio_id));
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
        specialityCode: filters?.especialidade_id ? String(filters.especialidade_id) : '-1',
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

  private async listSpecialities(
    integration: IntegrationDocument,
    filters: RequestParams,
  ): Promise<ISpecialityEntity[]> {
    try {
      const response = await this.konsistApiService.listSpecialities(integration);

      if (!response?.length) {
        return [];
      }

      return response.map((resource: any) => ({
        code: String(resource.id || resource.codigo),
        name: resource.nome?.trim() || resource.descricao?.trim(),
        specialityType: SpecialityTypes.C,
        canSchedule: true,
        canView: true,
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listSpecialities', error);
    }
  }

  // ==================== APPOINTMENT TYPES ====================

  private async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      // Konsist usa tipos fixos de agendamento
      const defaultTypes: IAppointmentTypeEntity[] = [
        {
          code: String(ScheduleType.Consultation),
          name: 'Consulta',
          ...this.getDefaultErpEntityData(integration),
        },
        {
          code: String(ScheduleType.Exam),
          name: 'Exame',
          ...this.getDefaultErpEntityData(integration),
        },
        {
          code: String(ScheduleType.FollowUp),
          name: 'Retorno',
          ...this.getDefaultErpEntityData(integration),
        },
      ];

      return defaultTypes;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listAppointmentTypes', error);
    }
  }

  /**
   * Busca múltiplas entidades por filtro
   */
  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: { [key: string]: string },
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }
}
