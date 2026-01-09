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

interface ListValidEntities {
  integration: IntegrationDocument;
  targetEntity: EntityType;
  filters: CorrelationFilter;
  cache?: boolean;
  patient?: InitialPatient;
  fromImport?: boolean;
}

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

  /**
   * Lista entidades válidas da API com cache
   */
  public async listValidApiEntities<T>(data: ListValidEntities): Promise<T[]> {
    const { integration, targetEntity, filters, cache } = data;

    try {
      const entities = await this.extractEntity(data);
      const codes = entities?.map((entity) => entity.code) ?? [];

      const customFilters: FilterQuery<EntityDocument> = {};

      if (targetEntity === EntityType.insurancePlan && filters?.insurance) {
        customFilters.insuranceCode = filters.insurance.code;
      }

      const dbEntities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        targetEntity,
        customFilters,
      );

      return dbEntities as unknown as T[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listValidApiEntities', error);
    }
  }

  /**
   * Extrai entidades da API Konsist
   */
  public async extractEntity(data: ListValidEntities): Promise<EntityTypes[]> {
    const { filters, integration, targetEntity, cache } = data;

    const resourceCacheParams = Object.keys(filters ?? {}).reduce((acc, key) => {
      if (filters[key]?.code) {
        acc[key] = filters[key].code;
      }
      return acc;
    }, {});

    if (cache) {
      const cachedResource = await this.integrationCacheUtilsService.getEntityCache(
        integration,
        targetEntity,
        resourceCacheParams,
      );

      if (cachedResource) {
        return cachedResource;
      }
    }

    let entities: EntityTypes[] = [];

    switch (targetEntity) {
      case EntityType.doctor:
        entities = await this.listDoctors(integration, filters);
        break;
      case EntityType.insurance:
        entities = await this.listInsurances(integration, filters);
        break;
      case EntityType.organizationUnit:
        entities = await this.listOrganizationUnits(integration, filters);
        break;
      case EntityType.procedure:
        entities = await this.listProcedures(integration, filters);
        break;
      case EntityType.speciality:
        entities = await this.listSpecialities(integration, filters);
        break;
      case EntityType.appointmentType:
        entities = await this.listAppointmentTypes(integration, filters);
        break;
      default:
        entities = [];
    }

    if (cache && entities?.length) {
      await this.integrationCacheUtilsService.setEntityCache(
        integration,
        targetEntity,
        resourceCacheParams,
        entities,
        getExpirationByEntity(targetEntity),
      );
    }

    return entities;
  }

  // ==================== DOCTORS ====================

  /**
   * Lista médicos da API Konsist
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
          ufCrm: resource.ufCrm,
          especialidade: resource.especialidade,
          email: resource.email,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listDoctors', error);
    }
  }

  // ==================== INSURANCES ====================

  /**
   * Lista convênios da API Konsist
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
          cnpj: resource.cnpj,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistEntitiesService.listInsurances', error);
    }
  }

  // ==================== ORGANIZATION UNITS ====================

  /**
   * Lista unidades organizacionais (filiais) da API Konsist
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

      return response.map((resource) => ({
        code: String(resource.id),
        name: resource.empresa?.trim() || resource.razaoSocial?.trim(),
        ...this.getDefaultErpEntityData(integration),
        data: {
          tipo: resource.tipo,
          cnpj: resource.cnpj,
          endereco: resource.endereco,
          numero: resource.numero,
          bairro: resource.bairro,
          cidade: resource.cidade,
          uf: resource.uf,
          cep: resource.cep,
          telefone: resource.telefone,
        },
      }));
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
   * Nota: Konsist não tem endpoint específico de especialidades,
   * extraímos dos médicos ou usamos lista fixa
   */
  public async listSpecialities(
    integration: IntegrationDocument,
    _filters: CorrelationFilter,
  ): Promise<ISpecialityEntity[]> {
    try {
      // Busca médicos para extrair especialidades únicas
      const doctors = await this.konsistApiService.listDoctors(integration);

      if (!doctors?.length) {
        return [];
      }

      // Extrai especialidades únicas dos médicos
      const specialitiesMap = new Map<string, ISpecialityEntity>();

      doctors.forEach((doctor) => {
        if (doctor.especialidade) {
          const code = String(doctor.especialidade).toLowerCase().replace(/\s+/g, '_');
          if (!specialitiesMap.has(code)) {
            specialitiesMap.set(code, {
              code,
              name: doctor.especialidade?.trim(),
              specialityType: SpecialityTypes.C,
              ...this.getDefaultErpEntityData(integration),
            });
          }
        }
      });

      return Array.from(specialitiesMap.values());
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
