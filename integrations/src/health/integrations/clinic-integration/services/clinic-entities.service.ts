import { Injectable } from '@nestjs/common';
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
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { ClinicApiService } from './clinic-api.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { defaultAppointmentTypes } from '../../../entities/default-entities';
import { FilterQuery } from 'mongoose';
import * as moment from 'moment';
import {
  ClinicDoctorParamsRequest,
  ClinicSinglePatientResponse,
  ClinicSpecialitiesParamsRequest,
  SpecialityData,
} from '../interfaces';
import { InitialPatient } from '../../../integrator/interfaces';

interface ListValidEntities {
  integration: IntegrationDocument;
  targetEntity: EntityType;
  filters: CorrelationFilter;
  cache?: boolean;
  patient?: InitialPatient;
  fromImport?: boolean;
}

@Injectable()
export class ClinicEntitiesService {
  constructor(
    private readonly clinicApiService: ClinicApiService,
    private readonly entitiesService: EntitiesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  // Mapeamento de tipos de agendamentos da CLINIC para os tipos padrão do BOT
  public clinicAppointmentTypesMapping: Record<string, string> = {
    '1': 'C', // Consulta
    '2': 'E', // Exame
    '4': 'CI', // Cirurgia
    C: 'COMP', // Compromisso
  };

  // Padrão Fixo Clinic:
  // '0': 'Primeira Consulta'
  // '1': 'Consulta'
  // '2': 'Exame'
  // '3': 'Retorno'
  // '4': 'Cirurgia'
  // '5': 'WEB'
  // '6': 'Bloqueio Automático'
  // 'C': 'Compromisso'
  // Tipos de agendamentos da CLINIC com códigos padrão BOT
  private defaultClinicAppointmentTypes: Partial<IAppointmentTypeEntity>[] = [
    {
      code: '0',
      name: 'Primeira Consulta',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
    {
      code: 'C',
      name: 'Consulta',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
    {
      code: 'E',
      name: 'Exame',
      params: {
        referenceScheduleType: ScheduleType.Exam,
      },
    },
    {
      code: '3',
      name: 'Retorno',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
    {
      code: 'CI',
      name: 'Cirurgia',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
    {
      code: '5',
      name: 'WEB',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
    {
      code: '6',
      name: 'Bloqueio Automático',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
    {
      code: 'COMP',
      name: 'Compromisso',
      params: {
        referenceScheduleType: ScheduleType.Consultation,
      },
    },
  ];

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
      throw INTERNAL_ERROR_THROWER('Clinic.listValidApiEntities', error);
    }
  }

  public async listAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return this.defaultClinicAppointmentTypes.map((resource) => {
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
      throw INTERNAL_ERROR_THROWER('ClinicService.listAppointmentTypes', error);
    }
  }

  public async listInsurances(integration: IntegrationDocument): Promise<IInsuranceEntity[]> {
    try {
      const response = await this.clinicApiService.listInsurances(integration);
      const data = response?.result?.items;
      return data?.map((resource) => ({
        code: String(resource.id),
        name: String(resource.name)?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.listInsurances', error);
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    patient: InitialPatient,
    fromImport?: boolean,
  ): Promise<IDoctorEntity[]> {
    try {
      const params: ClinicDoctorParamsRequest = {};

      if (!fromImport) {
        params.filter_web_disabled = 1;
      }

      if (filters?.insurance?.code) {
        params.health_insurance_id = filters.insurance.code;
      }

      if ((filters?.speciality?.data as SpecialityData)?.cbo) {
        params.specialty_cbo = (filters.speciality.data as SpecialityData).cbo;
      }

      if (patient?.bornDate) {
        params.birthday = moment(patient.bornDate).format('YYYY-MM-DD');
      }

      const response = await this.clinicApiService.listDoctors(integration, params);
      const listDoctorsClinic = response?.result?.items;

      let filteredDoctorsByAttendance = listDoctorsClinic;

      let patientSingleData: ClinicSinglePatientResponse;
      if (patient && !fromImport && integration?.rules?.getPatientDoctorAttended) {
        patientSingleData = (await this.clinicApiService.getSinglePatient(integration, patient.code))?.result;

        // Filtrar médicos que estão no attendedBy do paciente
        const attendedByDoctors = patientSingleData?.attendedBy || [];
        filteredDoctorsByAttendance = listDoctorsClinic?.filter((doctor) =>
          attendedByDoctors.some((attendedDoctor) => attendedDoctor.doctorId === doctor.id),
        );

        // Caso o paciente não tenha sido atendido por nenhum médico lista todos os médicos
        if (filteredDoctorsByAttendance.length === 0) {
          filteredDoctorsByAttendance = listDoctorsClinic;
        }
      }

      return filteredDoctorsByAttendance?.map((resource) => ({
        code: String(resource.id),
        name: String(resource.name)?.trim(),
        ...this.getDefaultErpEntityData(integration),
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.listDoctors', error);
    }
  }

  public async listOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const response = await this.clinicApiService.listOrganizationUnits(integration);
      const data = response?.result?.items;
      return Promise.all(
        data?.map(async (resource) => {
          const addressResponse = await this.clinicApiService.listOrganizationUnitAddress(integration);

          const entity: IOrganizationUnitEntity = {
            code: String(resource.id),
            name: String(resource.name)?.trim(),
            ...this.getDefaultErpEntityData(integration),
          };

          if (addressResponse?.result?.address) {
            entity.data = {
              address: addressResponse.result.address,
            };
          }

          return entity;
        }),
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.listOrganizationUnits', error);
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    patient: InitialPatient,
  ): Promise<ISpecialityEntity[]> {
    try {
      const params: ClinicSpecialitiesParamsRequest = {};

      if (filters?.insurance?.code) {
        params.health_insurance_id = filters.insurance.code;
      }

      if (patient?.bornDate) {
        params.birthday = moment(patient.bornDate).format('YYYY-MM-DD');
      }

      const response = await this.clinicApiService.listSpecialities(integration, params);
      const data = response?.result?.items;
      return data?.map((resource) => ({
        code: String(resource.id),
        name: String(resource.name)?.trim(),
        specialityType: SpecialityTypes.C,
        ...this.getDefaultErpEntityData(integration),
        data: {
          cbo: resource.cbo,
        },
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicService.listSpecialities', error);
    }
  }

  public async listProcedures(integration: IntegrationDocument): Promise<IProcedureEntity[]> {
    const entities: IProcedureEntity[] = [];

    if (integration.rules.listConsultationTypesAsProcedure) {
      try {
        const response = await this.clinicApiService.listConsultationTypes(integration);
        const data = response?.result?.items;

        // como importamos consultation type como procedimento, desconsideramos o código de especialidade e setamos como -1
        entities.push(
          ...data.map((resource) => {
            const entity: IProcedureEntity = {
              code: String(resource.id || resource.tbCodigo),
              name: String(resource.description)?.trim(),
              specialityType: SpecialityTypes.E,
              specialityCode: '-1',
              ...this.getDefaultErpEntityData(integration),
            };
            return entity;
          }),
        );
      } catch (error) {
        throw INTERNAL_ERROR_THROWER('ClinicService.listProcedures.listConsultationTypes', error);
      }
    }

    return entities;
  }

  public async extractEntity(data: ListValidEntities): Promise<EntityTypes[]> {
    const { filters, integration, targetEntity, cache, patient } = data;
    const resourceCacheParams = Object.keys(filters ?? {}).reduce((acc, key) => {
      acc[key] = filters[key].code;
      return acc;
    }, {});

    // quando for buscar médicos que ja foram atendidos por um paciente, não utiliza do cache
    if (
      cache &&
      (targetEntity !== EntityType.doctor ||
        (targetEntity === EntityType.doctor && !integration.rules.getPatientDoctorAttended))
    ) {
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
          return this.listOrganizationUnits(integration);

        case EntityType.insurance:
          return this.listInsurances(integration);

        case EntityType.doctor:
          return this.listDoctors(integration, filters, patient, data?.fromImport);

        case EntityType.speciality:
          return this.listSpecialities(integration, filters, patient);

        case EntityType.appointmentType:
          return this.listAppointmentTypes(integration);

        case EntityType.procedure:
          return this.listProcedures(integration);

        case EntityType.procedure:
          return null;

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
