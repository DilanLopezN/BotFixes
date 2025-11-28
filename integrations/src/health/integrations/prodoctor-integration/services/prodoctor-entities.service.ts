import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
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
import { ProdoctorApiService } from './prodoctor-api.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
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
      const response = await this.prodoctorApiService.listLocations(integration, { quantidade: 5000 });

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
      const response = await this.prodoctorApiService.listInsurances(integration, { quantidade: 5000 });

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

      const response = await this.prodoctorApiService.listUsers(integration, request);

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

      const response = await this.prodoctorApiService.listUsers(integration, request);
      if (!response?.sucesso || !response?.payload?.usuarios) {
        return [];
      }

      const defaultData = this.getDefaultErpEntityData(integration);
      const specialitiesMap = new Map<number, ISpecialityEntity>();

      for (const usuario of response.payload.usuarios) {
        if (!usuario.ativo) continue;

        const detalhes = await this.prodoctorApiService.getUserDetails(integration, usuario.codigo);

        if (detalhes?.sucesso && detalhes?.payload?.usuario?.especialidade) {
          const esp = detalhes.payload.usuario.especialidade;

          if (!specialitiesMap.has(esp.codigo)) {
            specialitiesMap.set(esp.codigo, {
              ...defaultData,
              code: String(esp.codigo),
              name: esp.nome,
              canSchedule: true,
              specialityType: SpecialityTypes.C,
              canView: true,
            });
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

      if (filters?.procedure?.data?.text) {
        request.tabelas = [{ codigo: Number(filters.procedure.data) }];
      }

      if (filters?.insurance?.code) {
        request.convenios = [{ codigo: Number(filters.insurance.code) }];
      }

      const response = await this.prodoctorApiService.listProcedures(integration, request);

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
        params: { referenceScheduleType: ScheduleType.Consultation },
      },
      {
        ...defaultData,
        code: 'retorno',
        name: 'Retorno',
        canSchedule: true,
        params: { referenceScheduleType: ScheduleType.FollowUp },
      },
      {
        ...defaultData,
        code: 'exame',
        name: 'Exame',
        canSchedule: true,
        params: { referenceScheduleType: ScheduleType.Exam },
      },
      {
        ...defaultData,
        code: 'cirurgia',
        name: 'Cirurgia',
        canSchedule: true,
        params: { referenceScheduleType: ScheduleType.Consultation },
      },
      {
        ...defaultData,
        code: 'teleconsulta',
        name: 'Teleconsulta',
        canSchedule: true,
        params: { referenceScheduleType: ScheduleType.Consultation },
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
   * Lista entidades válidas para o bot (chamado pelo prodoctor.service)
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

  /**
   * Lista entidades válidas da API (método legado)
   */
  public async listValidApiEntities(params: ListValidEntities): Promise<EntityDocument[]> {
    const { integration, targetEntity, filters, cache, patient } = params;
    return this.listValidEntities(integration, filters, targetEntity, cache, patient);
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
