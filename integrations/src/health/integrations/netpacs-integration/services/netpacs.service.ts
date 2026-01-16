import { HttpStatus, Injectable } from '@nestjs/common';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  EntityDocument,
  AppointmentTypeEntityDocument,
  OrganizationUnitEntityDocument,
  InsuranceEntityDocument,
  ProcedureEntityDocument,
  SpecialityEntityDocument,
  InsurancePlanEntityDocument,
  DoctorEntityDocument,
  TypeOfServiceEntityDocument,
  TypeOfService,
} from '../../../entities/schema';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
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
import { Patient } from '../../../interfaces/patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import {
  GetPatientResponse,
  CreatePatientRequest,
  CreatePacientResponse,
  SchedulesRequestParams,
  SchedulesResponse,
  ProceduresResponse,
  ModalitiesResponse,
  InsurancesResponse,
  UpdateAttendanceStatusRequest,
  CancelAttendanceRequest,
  CreateScheduleRequest,
  CreateScheduleResponse,
  AttendanceResponse,
  AttendancesRequestParams,
  InsurancePlanResponse,
  NetpacsSpecialityType,
  DoctorsResponse,
  ProfessionalsResponse,
  UpdatePatientRequest,
  UnitResponse,
  OrganizationUnitData,
  GroupedSchedulesResponseParams,
  GroupedSchedulesResponse,
  GetProcedureValueParams,
  FollowUpAppointmentsResponse,
} from '../interfaces';
import { NetpacsApiService } from './netpacs-api.service';
import * as moment from 'moment';
import { HttpErrorOrigin, HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { groupBy, head, mapValues, orderBy } from 'lodash';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { CancelSchedule, CancelScheduleV2 } from '../../../integrator/interfaces/cancel-schedule.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import {
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { ConfirmSchedule, ConfirmScheduleV2 } from '../../../integrator/interfaces/confirm-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import { defaultAppointmentTypes, defaultTypesOfService } from '../../../entities/default-entities';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import {
  GetScheduleValue,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  Reschedule,
  ValidateScheduleConfirmation,
} from '../../../integrator/interfaces';
import { NetpacsConfirmationService } from './netpacs-confirmation.service';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { NetpacsServiceHelpersService } from './netpacs-helpers.service';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';

type RequestParams = { [key: string]: any };

@Injectable()
export class NetpacsService implements IIntegratorService {
  constructor(
    private readonly netpacsApiService: NetpacsApiService,
    private readonly netpacsServiceHelpersService: NetpacsServiceHelpersService,
    private readonly netpacsConfirmationService: NetpacsConfirmationService,
    private readonly entitiesService: EntitiesService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  private async getOrganizationUnits(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      let page = 1;
      const apiEntities: UnitResponse[] = [];
      let response: UnitResponse[];
      do {
        response = await this.netpacsApiService.listUnits(integration, {
          ...requestFilters,
          page,
          limit: 100,
        });
        if (response?.length > 0) {
          apiEntities.push(...response);
        }
        page++;
      } while (response.length >= 100 && page < 10);

      const entities = apiEntities
        ?.filter((resource) => resource.agendamento_externo)
        ?.map((resource) => {
          const data: OrganizationUnitData = {
            address: '',
            idFilial: resource.id_filial,
          };

          if (resource?.endereco) {
            data.address = `${resource.endereco?.trim()} ${resource.numero}, ${resource.bairro} - ${resource.cidade}`;
          }

          const entity: IOrganizationUnitEntity = {
            code: String(resource.id_unidade),
            integrationId: castObjectId(integration._id),
            name: String(resource.nome).trim(),
            source: EntitySourceType.erp,
            activeErp: true,
            version: EntityVersionType.production,
            data,
          };

          return entity;
        });

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private getSpecialityType(type: NetpacsSpecialityType): SpecialityTypes {
    switch (type) {
      case 'RETORNO':
        return SpecialityTypes.R;

      case 'CONSULTA':
        return SpecialityTypes.C;

      case 'EXAME':
        return SpecialityTypes.E;
    }
  }

  private async getProcedures(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IProcedureEntity[]> {
    try {
      let page = 1;
      let apiEntities: ProceduresResponse[] = [];
      let response: ProceduresResponse[];
      do {
        if (requestFilters?.id_plano_convenio) {
          response = await this.netpacsApiService.getProceduresByInsurance(integration, {
            ...requestFilters,
            page,
            limit: 100,
          });
        } else {
          response = await this.netpacsApiService.getProcedures(integration, {
            ...requestFilters,
            page,
            limit: 100,
          });
        }

        if (response?.length > 0) {
          apiEntities.push(...response);
        }
        page++;
      } while (response.length >= 100 && page < 10);

      //endpoint getProceduresByInsurance não filtra por modalidade, filtro em memoria.
      if (requestFilters?.id_modalidade && requestFilters?.id_plano_convenio) {
        apiEntities = apiEntities.filter(
          (procedure) => Number(procedure.idModalidade) === Number(requestFilters.id_modalidade),
        );
      }

      const entities = apiEntities?.map((resource) => {
        const entity: IProcedureEntity = {
          code: String(resource.id_procedimento || resource.idProcedimento),
          integrationId: castObjectId(integration._id),
          name: String(resource.nome).trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          specialityCode: String(resource.id_modalidade || resource.idModalidade),
          specialityType: this.getSpecialityType(resource.tipo),
        };

        if (resource.orientacao) {
          entity.guidance = resource.orientacao;
        }

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private async getModalities(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<ISpecialityEntity[]> {
    // busca procedimentos para preencher o tipo de especialidade na entidade
    // já que só existe no procedimento

    // melhorar depois quando for utilizado para agendamento nesta situação ficará só para extrair as entidades
    // @TODO: se tiver appointmentType terá q filtrar as especialidades em memória para retornar
    const procedures = await this.getProcedures(integration, {});
    const mappedProcedures = mapValues(groupBy(procedures, 'specialityCode'), (v) => head(v));

    try {
      let page = 1;
      const apiEntities: ModalitiesResponse[] = [];
      let response: ModalitiesResponse[];
      do {
        response = await this.netpacsApiService.getModalities(integration, {
          ...requestFilters,
          page,
          limit: 100,
        });
        if (response?.length > 0) {
          apiEntities.push(...response);
        }
        page++;
      } while (response.length >= 100 && page < 10);

      const entities = apiEntities?.map((resource) => {
        const entity: ISpecialityEntity = {
          code: String(resource.id_modalidade),
          integrationId: castObjectId(integration._id),
          name: resource.descricao?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          specialityType: mappedProcedures[String(resource.id_modalidade)]?.specialityType,
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private async getInsurances(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsuranceEntity[]> {
    try {
      let page = 1;
      const apiEntities: InsurancesResponse[] = [];
      let response: InsurancesResponse[];
      do {
        response = await this.netpacsApiService.getInsurances(integration, {
          ...requestFilters,
          page,
          limit: 100,
        });
        if (response?.length > 0) {
          apiEntities.push(...response);
        }
        page++;
      } while (response.length >= 100 && page < 10);

      const entities = apiEntities?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: String(resource.id_convenio),
          integrationId: castObjectId(integration._id),
          name: String(resource.nome).trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private async getTypeOfServices(integration: IntegrationDocument): Promise<ITypeOfServiceEntity[]> {
    try {
      return (
        defaultTypesOfService?.map((resource) => ({
          code: resource.code,
          integrationId: castObjectId(integration._id),
          name: resource.name?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          params: {
            ...resource.params,
          },
        })) || []
      );
    } catch (error) {
      throw error;
    }
  }

  private async getAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      const entities = defaultAppointmentTypes.map((resource) => {
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

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private async getInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      let page = 1;
      const apiEntities: InsurancePlanResponse[] = [];
      let response: InsurancePlanResponse[];
      do {
        response = await this.netpacsApiService.getInsurancePlans(integration, {
          ...requestFilters,
          page,
          limit: 100,
        });
        if (response?.length > 0) {
          apiEntities.push(...response);
        }
        page++;
      } while (response.length >= 100 && page < 10);

      const entities = apiEntities?.map((resource) => {
        const entity: IInsurancePlanEntity = {
          code: String(resource.id_plano_convenio),
          integrationId: castObjectId(integration._id),
          name: String(resource.nome).trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          insuranceCode: String(resource.id_convenio),
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private async getDoctors(
    integration: IntegrationDocument,
    _: RequestParams,
    filters: CorrelationFilter,
  ): Promise<IDoctorEntity[]> {
    try {
      let page = 1;
      const apiDoctors: DoctorsResponse[] = [];
      const apiProfessionals: ProfessionalsResponse[] = [];
      let doctorsResponse: DoctorsResponse[];
      let professionalsResponse: ProfessionalsResponse[];

      do {
        doctorsResponse = await this.netpacsApiService.getDoctors(integration, {
          page,
          limit: 100,
          executor: true,
        });

        if (doctorsResponse.length > 0) {
          apiDoctors.push(...doctorsResponse);
          const professionalsKeys = doctorsResponse.map((doctor) => doctor.id_profissional);
          professionalsResponse = await this.netpacsApiService.getProfessionals(integration, {
            id_profissional: `in:${professionalsKeys}`,
            page,
            limit: 100,
          });
          apiProfessionals.push(...professionalsResponse);
        }

        page++;
      } while (doctorsResponse.length >= 100 && page < 10);

      const entities = apiDoctors?.map((resource) => {
        const professional = apiProfessionals.find(
          (professional) => professional.id_profissional === resource.id_profissional,
        );

        if (!professional) {
          return;
        }

        const entity: IDoctorEntity = {
          code: String(resource.id_medico),
          integrationId: castObjectId(integration._id),
          name: String(professional?.nome).trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        };

        return entity;
      });

      const { procedure } = filters ?? {};
      // lógica para a ortoimagem e clinifemina
      if (integration.rules?.useNetpacsDoctorByProcedure && procedure?.code) {
        const validDoctors = [];

        for (const doctor of entities) {
          try {
            const data = await this.netpacsApiService.listProceduresByDoctor(integration, { doctorCode: doctor.code });
            if (
              data?.length &&
              data.find((netpacsProcedure) => String(netpacsProcedure.idProcedimento) === String(procedure.code))
            ) {
              validDoctors.push(doctor);
            }
          } catch (error) {}
        }

        return validDoctors;
      }

      return entities || [];
    } catch (error) {
      throw error;
    }
  }

  private getResourceFilters(targetEntity: EntityType, filters: CorrelationFilter, fromImport: boolean): RequestParams {
    const params: RequestParams = {};

    if (targetEntity === EntityType.speciality || targetEntity === EntityType.insurance) {
      params.agendamento_externo = true;
    }

    if (targetEntity === EntityType.procedure && !fromImport) {
      params.permitir_agendamento = true;
    }

    if (!filters || Object.keys(filters).length === 0) {
      return params;
    }

    // enviar filtros em rotas especificas, caso contrário quebra
    if (
      (targetEntity === EntityType.speciality ||
        targetEntity === EntityType.insurance ||
        targetEntity === EntityType.procedure) &&
      filters.hasOwnProperty(EntityType.organizationUnit)
    ) {
      params.id_filial = (filters[EntityType.organizationUnit].data as unknown as OrganizationUnitData).idFilial;
    }

    if (targetEntity === EntityType.insurancePlan && filters.hasOwnProperty(EntityType.insurance)) {
      params.id_convenio = filters[EntityType.insurance].code;
    }

    if (targetEntity === EntityType.procedure && filters.hasOwnProperty(EntityType.speciality)) {
      params.id_modalidade = filters[EntityType.speciality].code;
    }

    if (targetEntity === EntityType.doctor && filters[EntityType.procedure]) {
      params.id_procedimento = filters[EntityType.procedure].code;
    }

    if (targetEntity === EntityType.procedure && filters.hasOwnProperty(EntityType.insurancePlan)) {
      params.id_plano_convenio = filters[EntityType.insurancePlan].code;
      // a API que utiliza o id_plano_convenio filtra com permitirAgendamento e não com permitir_agendamento
      if (params.permitir_agendamento) {
        delete params.permitir_agendamento;
        params.permitirAgendamento = true;
      }
    }

    return params;
  }

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ) {
    return await this.extractEntity(integration, entityType, filter, cache, true);
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filters?: CorrelationFilter,
    cache?: boolean,
    fromImport = false,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, filters, fromImport);

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
          return this.getOrganizationUnits(integration, requestFilters);

        case EntityType.insurance:
          return this.getInsurances(integration, requestFilters);

        case EntityType.insurancePlan:
          return this.getInsurancePlans(integration, requestFilters);

        case EntityType.doctor:
          return this.getDoctors(integration, requestFilters, filters);

        case EntityType.speciality:
          return this.getModalities(integration, requestFilters);

        case EntityType.appointmentType:
          return this.getAppointmentTypes(integration);

        case EntityType.typeOfService:
          return this.getTypeOfServices(integration);

        case EntityType.procedure:
          return this.getProcedures(integration, requestFilters);

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

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.appointmentType,
        filters,
        cache,
      )) as IAppointmentTypeEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.appointmentType,
      )) as AppointmentTypeEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiOrganizationUnits(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.organizationUnit,
        filters,
        cache,
      )) as IOrganizationUnitEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.organizationUnit,
      )) as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiInsurances(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.insurance, filters, cache)) as IInsuranceEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurance,
      )) as InsuranceEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.procedure, filters, cache)) as IProcedureEntity[];
      const codes = data?.map((org) => org.code);
      const entities = (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.procedure,
      )) as ProcedureEntityDocument[];

      const validEntities: ProcedureEntityDocument[] = [];

      const grouped = data.reduce((acc, entity) => {
        acc[`${entity.code}:${entity.specialityCode}:${entity.specialityType}`] = entity;
        return acc;
      }, {});

      // compara com especialidade já que existem códigos iguais de procedimento
      // com exceção quando a entidade salva é criada pelo usuário para permitir entidades customizadas
      entities.forEach((entity) => {
        if (
          entity.source === EntitySourceType.user ||
          !!grouped[`${entity.code}:${entity.specialityCode}:${entity.specialityType}`]
        ) {
          validEntities.push(entity);
        }
      });
      return validEntities;
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.doctor, filters, cache)) as IDoctorEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.doctor,
      )) as DoctorEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.speciality,
        filters,
        cache,
      )) as ISpecialityEntity[];
      const codes = data?.map((org) => org.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.speciality,
      )) as SpecialityEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsurancePlanEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.insurancePlan,
        filters,
        cache,
      )) as IInsurancePlanEntity[];
      const codes = data?.map((org) => org.code);
      const entities = (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurancePlan,
      )) as InsurancePlanEntityDocument[];

      const validEntities: InsurancePlanEntityDocument[] = [];

      data.forEach((receivedEntity) => {
        entities.forEach((savedEntity) => {
          if (receivedEntity.code === savedEntity.code && receivedEntity.insuranceCode === savedEntity.insuranceCode) {
            validEntities.push(savedEntity);
          }
        });
      });

      return validEntities;
    } catch (error) {
      throw error;
    }
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.appointmentType:
        return await this.getValidApiAppointmentTypes(integration, rawFilter, cache);

      case EntityType.speciality:
        return await this.getValidApiSpecialities(integration, rawFilter, cache);

      case EntityType.organizationUnit:
        return await this.getValidApiOrganizationUnits(integration, rawFilter, cache);

      case EntityType.insurance:
        return await this.getValidApiInsurances(integration, rawFilter, cache);

      case EntityType.insurancePlan:
        return await this.getValidApiInsurancePlans(integration, rawFilter, cache);

      case EntityType.procedure:
        return await this.getValidApiProcedures(integration, rawFilter, cache);

      case EntityType.doctor:
        return await this.getValidApiDoctors(integration, rawFilter, cache);

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

      default:
        return [] as EntityDocument[];
    }
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  private replacePatient(result: GetPatientResponse): Patient {
    return {
      phone: result.telefone,
      cellPhone: result.telefone_celular,
      email: result.email || '',
      name: result.nome.trim(),
      sex: result.sexo,
      code: String(result.id_paciente),
      cpf: result.cpf,
      bornDate: moment(result.data_nascimento).format('YYYY-MM-DD'),
      // id utilizado em outras requisições, como listarAgendamentos do paciente
      data: {
        erpId: result.pat_id,
      },
    };
  }

  private async getPatientByCode(integration: IntegrationDocument, code: string): Promise<Patient> {
    try {
      const data: GetPatientResponse = await this.netpacsApiService.getPatientByCode(integration, code);
      return this.replacePatient(data);
    } catch (error) {
      throw error;
    }
  }

  private async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<Patient> {
    try {
      const data: GetPatientResponse[] = await this.netpacsApiService.getPatientByCpf(integration, cpf);
      return this.replacePatient(data[0]);
    } catch (error) {
      throw error;
    }
  }

  public async getPatient(
    integration: IntegrationDocument,
    filters: PatientFilters,
    ignoreCache?: boolean,
  ): Promise<Patient> {
    const { cpf, code } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

    if (!ignoreCache && patientCache) {
      return patientCache;
    }

    let patient: Patient;

    if (!!cpf) {
      patient = await this.getPatientByCpf(integration, cpf);
    } else if (!!code) {
      patient = await this.getPatientByCode(integration, code);
    }

    await this.integrationCacheUtilsService.setPatientCache(integration, code, cpf, patient);
    return patient;
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    const payload: UpdatePatientRequest = {
      dataNascimentoPaciente: moment(patient.bornDate).format('DD/MM/YYYY'),
      cpf: patient.cpf,
      email: patient.email || '',
      nomePaciente: integration?.rules?.patientNameCase ? patient.name : patient.name.toUpperCase(),
      sexoPaciente: patient.sex?.toUpperCase(),
      telefonePaciente: formatPhone(convertPhoneNumber(patient.phone || patient.cellPhone), true),
      telefoneCelular: formatPhone(convertPhoneNumber(patient.cellPhone || patient.phone), true),
    };

    if (patient.identityNumber) {
      payload.rg = patient.identityNumber;
    }

    try {
      const data: CreatePacientResponse = await this.netpacsApiService.updatePatient(integration, payload, patientCode);
      return await this.getPatient(
        integration,
        {
          code: data.idPaciente,
          cpf: undefined,
          bornDate: undefined,
        },
        true,
      );
    } catch (error) {
      throw error;
    }
  }

  public async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    const payload: CreatePatientRequest = {
      dataNascimentoPaciente: moment(patient.bornDate).format('DD/MM/YYYY'),
      cpf: patient.cpf,
      email: patient.email || '',
      nomePaciente: integration?.rules?.patientNameCase ? patient.name : patient.name.toUpperCase(),
      sexoPaciente: patient.sex?.toUpperCase(),
      telefonePaciente: formatPhone(convertPhoneNumber(patient.phone || patient.cellPhone), true),
      telefoneCelular: formatPhone(convertPhoneNumber(patient.cellPhone || patient.phone), true),
    };

    if (patient.identityNumber) {
      payload.rg = patient.identityNumber;
    }

    try {
      const data: CreatePacientResponse = await this.netpacsApiService.createPatient(integration, payload);
      return await this.getPatient(
        integration,
        {
          code: data.idPaciente,
          cpf: undefined,
          bornDate: undefined,
        },
        true,
      );
    } catch (error) {
      throw error;
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = cancelSchedule;
      const payload: CancelAttendanceRequest = {
        idMotivoSituacao: 1,
      };

      await this.netpacsApiService.cancelAttendance(integration, scheduleCode, payload);
      return { ok: true };
    } catch (error) {
      throw error;
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    const { appointmentCode: scheduleCode } = confirmSchedule;
    const payload: UpdateAttendanceStatusRequest = { idSituacao: 3 };

    try {
      await this.netpacsApiService.updateAttendanceStatus(integration, scheduleCode, payload);
    } catch (error) {
      const isAlreadyConfirmed =
        error?.response?.error?.message?.includes('O Atendimento já se encontra na situação que deseja alterar.') ||
        error?.response?.error?.message?.includes(
          'encontra-se na situação de Cancelado. A situação não pode ser alterada.',
        );

      if (!isAlreadyConfirmed) {
        throw error;
      }
    }

    return { ok: true };
  }

  public async createSchedule(integration: IntegrationDocument, schedule: CreateSchedule): Promise<Appointment> {
    const { appointment, insurance, procedure, patient } = schedule;
    const { data } = appointment;

    const payload: CreateScheduleRequest = {
      idConvenio: parseInt(insurance.code, 10),
      idPlanoConvenio: parseInt(insurance.planCode, 10),
      idPaciente: parseInt(patient.code, 10),
      envioMensagemOrientacao: false,
      encaixe: false,
      listHorarioDTO: [
        {
          idProcedimento: parseInt(procedure.code, 10),
        },
      ],
    };

    if (appointment.code !== '-1') {
      payload.listHorarioDTO[0].idHorario = parseInt(appointment.code, 10);
      // Se o cliente utiliza "horário virtual" na integração utiliza esta lógica
    } else if (!!data && appointment.code === '-1') {
      const formattedDate = moment(data.dataString.split('/').reverse().join('-')).format('YYYY-MM-DD');

      payload.listHorarioDTO[0] = {
        ...payload.listHorarioDTO[0],
        idMedico: data.idMedico,
        idEscala: data.idEscala,
        idSala: data.idSala,
        duracaoProcedimento: data.duracaoProcedimento,
        horaInicialString: `${String(data.horaInicialString)}:00`,
        dataString: formattedDate,
      };
    }

    try {
      const data: CreateScheduleResponse = await this.netpacsApiService.createSchedule(integration, [payload]);
      if (data?.status === 'OK') {
        const schedule: Appointment = {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          appointmentCode: appointment.code,
          status: AppointmentStatus.scheduled,
        };

        if (integration.rules?.sendGuidanceOnCreateSchedule) {
          const savedProcedure = (await this.entitiesService.getEntityByCode(
            procedure.code,
            EntityType.procedure,
            integration._id,
          )) as ProcedureEntityDocument;

          if (savedProcedure?.guidance) {
            schedule.guidance = savedProcedure.guidance;
          }
        }

        return schedule;
      } else {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, data.message, HttpErrorOrigin.INTEGRATION_ERROR);
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('NetpacsService.createSchedule', error);
    }
  }

  private async filterSchedulesByStatusAndDates(response: AttendanceResponse[]): Promise<AttendanceResponse[]> {
    const schedulesFiltered = response.filter((schedule) => {
      // remove os agendamentos com situação de sistema de id 27
      // 27 = "FINALIZADO"
      if (schedule.idSituacao === 27) return false;

      // filtra os agendamentos que já passaram
      const convertedSchedule = this.netpacsServiceHelpersService.convertStartDate(schedule.data, schedule.horaInicial);
      const scheduleDateTime = moment(convertedSchedule).utc();
      const now = moment.utc();

      return scheduleDateTime.isSameOrAfter(now);
    });

    return schedulesFiltered;
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;
    const patient: Patient = await this.getPatientFromCache(integration, patientCode);

    const params: AttendancesRequestParams = {
      dataInicial: '01/01/2020',
      limit: 100,
      dataFinal: moment().add(2, 'years').format('DD/MM/YYYY'),
      listPatId: patient.data.erpId,
    };

    if (startDate) {
      params.dataInicial = moment(startDate).format('DD/MM/YYYY');
    }
    if (endDate) {
      params.dataFinal = moment(endDate).format('DD/MM/YYYY');
    }

    try {
      const response: AttendanceResponse[] = await this.netpacsApiService.getAttendances(integration, params);
      if (response.length === 0 || !response) {
        return [];
      }

      // filtrar a resposta da API com status aceitos e datas futuras
      const responseFiltered = await this.filterSchedulesByStatusAndDates(response);

      const rawAppointments: RawAppointment[] = await Promise.all(
        responseFiltered.map(
          async (netpacsSchedule) =>
            await this.netpacsServiceHelpersService.createPatientApointmentObject(integration, netpacsSchedule),
        ),
      );

      return await this.appointmentService.transformSchedules(integration, rawAppointments);
    } catch (error) {
      throw error;
    }
  }

  private async getPatientFromCache(integration: IntegrationDocument, patientCode: string) {
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, patientCode);

    if (!!patientCache) {
      return patientCache as Patient;
    } else {
      return await this.getPatient(integration, {
        cpf: undefined,
        code: patientCode,
      });
    }
  }

  public async splitGetAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    payload: SchedulesRequestParams,
  ): Promise<SchedulesResponse[][]> {
    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 15;
    const dateFormat = 'DD/MM/YYYY';

    if (availableSchedules.dateLimit) {
      const diff = moment(availableSchedules.dateLimit).diff(moment(), 'days');
      availableSchedules.untilDay = diff;
    }

    const range = availableSchedules.untilDay;
    const stackMultiply = 1;

    if (range <= maxRangeDays) {
      return await this.netpacsApiService.getSchedules(integration, payload);
    }

    const requestsNumber = Math.ceil(range / maxRangeDays);

    const responsePromises = [];
    const response: SchedulesResponse[][] = [];

    for (let stack = 0; stack < requestsNumber; stack = stack + stackMultiply) {
      const fromDay =
        moment(moment().add(availableSchedules.fromDay, 'days').startOf('day'))
          .add(stack * maxRangeDays, 'days')
          .diff(moment(), 'days') + 1;

      const dynamicPayload: SchedulesRequestParams = {
        ...payload,
        dataBusca: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      };

      responsePromises.push(this.netpacsApiService.getSchedules(integration, dynamicPayload));
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<SchedulesResponse[][]>) => {
          value?.forEach((item) => {
            const data = item?.filter((schedule) => {
              return (
                moment(schedule.data).valueOf() >=
                moment().add(availableSchedules.fromDay, 'day').startOf('day').valueOf()
              );
            });
            response.push(data);
          });
        });
    });

    return response;
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    // logica para ortoimagem
    if (integration.rules?.useNetpacsGroupedSchedules) {
      return await this.getAvailableSchedulesGrouped(integration, availableSchedules);
    }

    const {
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      filter,
      fromDay,
      patient,
      limit,
      periodOfDay,
    } = availableSchedules;
    const dateFormat = 'DD/MM/YYYY';
    const idFilial = (filter.organizationUnit.data as unknown as OrganizationUnitData).idFilial;

    const params: SchedulesRequestParams = {
      idConvenio: filter.insurance.code,
      listIdProcedimento: filter.procedure.code,
      idFilial: String(idFilial),
      idPlanoConvenio: filter.insurancePlan.code,
      dataBusca: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      buscaInteligente: true,
      idPaciente: patient?.code ?? null,
      idadePaciente: moment().diff(patient.bornDate, 'years') ?? null,
    };

    if (filter.doctor?.code) {
      params.idMedico = filter.doctor.code;
    }

    if (patient?.sex) {
      patient.sex = patient.sex.toUpperCase();

      if (['M', 'F'].includes(patient.sex)) {
        params.sexoPaciente = patient.sex;
      }
    }

    try {
      const schedulesAvailable: SchedulesResponse[][] = await this.splitGetAvailableSchedules(
        integration,
        availableSchedules,
        params,
      );
      const data: SchedulesResponse[] = schedulesAvailable.flat();

      const doctorsSet = new Set([]);
      const replacedAppointments: RawAppointment[] = [];

      data?.forEach((app) => doctorsSet.add(app.idMedico));

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entitiesFilter: availableSchedules.filter,
        entities: doctors,
        targetEntity: FlowSteps.doctor,
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const doctorsMap = validDoctors.reduce((map: { [key: string]: boolean }, doctor) => {
        map[doctor.code] = true;
        return map;
      }, {});

      data?.forEach((appointment) => {
        if (doctorsMap[appointment.idMedico] && appointment.idUnidade === Number(filter.organizationUnit?.code)) {
          const newAppointment: RawAppointment = {
            appointmentCode: String(appointment.idHorario ?? '-1'),
            appointmentDate: this.netpacsServiceHelpersService.convertStartDate(
              appointment.data,
              appointment.horaInicial,
            ),
            duration: String(appointment.duracaoProcedimento),
            procedureId: String(appointment.idProcedimento),
            doctorId: String(appointment.idMedico),
            organizationUnitId: filter.organizationUnit.code,
            status: AppointmentStatus.scheduled,
          };

          if (newAppointment.appointmentCode === '-1') {
            newAppointment.data = {
              idMedico: appointment.idMedico,
              idEscala: appointment.idEscala,
              idSala: appointment.idSala,
              duracaoProcedimento: appointment.duracaoProcedimento,
              horaInicialString: appointment.horaInicialString,
              dataString: appointment.dataString,
            };
          }

          replacedAppointments.push(newAppointment);
        }
      });

      const { appointments: randomizedAppointments, metadata: partialMetadata } =
        await this.appointmentService.getAppointments(
          integration,
          {
            limit,
            period,
            randomize,
            sortMethod,
            periodOfDay,
          },
          replacedAppointments,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...partialMetadata } };
    } catch (error) {
      throw error;
    }
  }

  public async splitGetAvailableSchedulesGrouped(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
    payload: GroupedSchedulesResponseParams,
  ): Promise<GroupedSchedulesResponse[]> {
    const maxRangeDays = 15;
    const dateFormat = 'DD/MM/YYYY';

    if (availableSchedules.dateLimit) {
      const diff = moment(availableSchedules.dateLimit).diff(moment(), 'days');
      availableSchedules.untilDay = diff;
    }

    const range = availableSchedules.untilDay;
    const stackMultiply = 1;

    if (range <= maxRangeDays) {
      return await this.netpacsApiService.listGroupedSchedules(integration, payload);
    }

    const requestsNumber = Math.ceil(range / maxRangeDays);

    const responsePromises = [];
    const response: GroupedSchedulesResponse[] = [];

    for (let stack = 0; stack < requestsNumber; stack = stack + stackMultiply) {
      const fromDay =
        moment(moment().add(availableSchedules.fromDay, 'days').startOf('day'))
          .add(stack * maxRangeDays, 'days')
          .diff(moment(), 'days') + 1;

      const dynamicPayload: GroupedSchedulesResponseParams = {
        ...payload,
        dataBusca: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      };

      responsePromises.push(this.netpacsApiService.listGroupedSchedules(integration, dynamicPayload));
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<GroupedSchedulesResponse[]>) => {
          value?.forEach((item) => {
            const betweenRange =
              moment(item.dataTimeStamp).valueOf() >=
              moment().add(availableSchedules.fromDay, 'day').startOf('day').valueOf();

            if (betweenRange) {
              response.push(item);
            }
          });
        });
    });

    return response;
  }

  public async getAvailableSchedulesGrouped(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      filter,
      fromDay,
      patient,
      limit,
      periodOfDay,
    } = availableSchedules;
    const dateFormat = 'DD/MM/YYYY';
    const idFilial = (filter.organizationUnit.data as unknown as OrganizationUnitData).idFilial;

    const isFollowUpAppointment = filter.typeOfService?.params?.referenceTypeOfService === TypeOfService.followUp;
    let followUpPatientAppointments: FollowUpAppointmentsResponse[] = [];
    let relatedFollowUpPatientAppointment: FollowUpAppointmentsResponse = {} as FollowUpAppointmentsResponse;

    if (isFollowUpAppointment) {
      followUpPatientAppointments = await this.netpacsApiService.getFollowUpPatientAppointments(integration, {
        idPaciente: Number(patient?.code) ?? null,
      });

      relatedFollowUpPatientAppointment = followUpPatientAppointments?.filter(
        (schedule) => schedule.idProcedimento.toString() === filter.procedure.code,
      )[0];

      if (relatedFollowUpPatientAppointment) {
        filter.procedure.code = relatedFollowUpPatientAppointment.idProcedimentoRetorno?.toString();
      } else {
        return { schedules: [], metadata: {} };
      }
    }

    const params: GroupedSchedulesResponseParams = {
      idConvenio: filter.insurance.code,
      listIdProcedimento: filter.procedure.code,
      idFilial: String(idFilial),
      idPlanoConvenio: filter.insurancePlan.code,
      dataBusca: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      buscaInteligente: true,
      idPaciente: patient?.code ?? null,
    };

    if (filter.doctor?.code) {
      params.idMedico = filter.doctor.code;
    }

    try {
      let data = await this.splitGetAvailableSchedulesGrouped(integration, availableSchedules, params);

      const doctorsSet = new Set([]);
      const replacedAppointments: RawAppointment[] = [];

      const tempSchedules: RawAppointment[] = [];

      data?.forEach((resourceDate) => {
        resourceDate?.unidades.forEach((resourceUnit) => {
          resourceUnit?.medicos.forEach((resourceDoctor) => {
            doctorsSet.add(resourceDoctor.idMedico);

            resourceDoctor?.horarios.forEach((doctorDate) => {
              const appointmentDate = this.netpacsServiceHelpersService.convertStartDate(
                resourceDate.dataTimeStamp,
                doctorDate.horarioTimestamp,
              );

              const newAppointment: RawAppointment = {
                appointmentCode: String(doctorDate.idHorario),
                appointmentDate,
                duration: String(-1),
                procedureId: String(filter.procedure.code),
                doctorId: String(resourceDoctor.idMedico),
                organizationUnitId: String(filter.organizationUnit.code),
                status: AppointmentStatus.scheduled,
              };

              // Se for retorno realiza filtro em memória
              if (
                (isFollowUpAppointment &&
                  moment(appointmentDate).valueOf() <=
                    moment(relatedFollowUpPatientAppointment?.dataLimiteRetorno).valueOf()) ||
                !isFollowUpAppointment
              ) {
                tempSchedules.push(newAppointment);
              }
            });
          });
        });
      });

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entitiesFilter: availableSchedules.filter,
        entities: doctors,
        targetEntity: FlowSteps.doctor,
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const doctorsMap = validDoctors.reduce((map: { [key: string]: boolean }, doctor) => {
        map[doctor.code] = true;
        return map;
      }, {});

      tempSchedules?.forEach((schedule) => {
        if (doctorsMap[schedule.doctorId]) {
          replacedAppointments.push(schedule);
        }
      });

      const { appointments: randomizedAppointments, metadata: partialMetadata } =
        await this.appointmentService.getAppointments(
          integration,
          {
            limit,
            period,
            randomize,
            sortMethod,
            periodOfDay,
          },
          replacedAppointments,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('NetpacsService.getAvailableSchedulesGrouped', error);
    }
  }

  async getMinifiedPatientSchedules(integration: IntegrationDocument, patientSchedules?: PatientSchedules) {
    const { patientCode, startDate, endDate } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    const patient: Patient = await this.getPatientFromCache(integration, patientCode);

    const params: AttendancesRequestParams = {
      dataInicial: '01/01/2020',
      limit: 100,
      dataFinal: moment().add(2, 'years').format('DD/MM/YYYY'),
      listPatId: patient.data.erpId,
    };

    if (startDate) {
      params.dataInicial = moment(startDate).format('DD/MM/YYYY');
    }

    if (endDate) {
      params.dataFinal = moment(endDate).format('DD/MM/YYYY');
    }

    try {
      const result: AttendanceResponse[] = await this.netpacsApiService.getAttendances(integration, params);

      // filtrar a resposta da API com status aceitos e datas futuras
      const resultFiltered = await this.filterSchedulesByStatusAndDates(result);

      if (!resultFiltered.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        resultFiltered.map(async (netpacsSchedule) => {
          const [appointment] = await this.appointmentService.transformSchedules(integration, [
            await this.netpacsServiceHelpersService.createPatientApointmentObject(integration, netpacsSchedule),
          ]);

          const flowSteps = [FlowSteps.listPatientSchedules];

          if (patientSchedules.target) {
            flowSteps.push(patientSchedules.target);
          }

          const flowActions = await this.flowService.matchFlowsAndGetActions({
            integrationId: integration._id,
            targetFlowTypes: flowSteps,
            entitiesFilter: {
              appointmentType: appointment.appointmentType,
              doctor: appointment.doctor,
              insurance: appointment.insurance,
              insurancePlan: appointment.insurancePlan,
              insuranceSubPlan: appointment.insuranceSubPlan,
              organizationUnit: appointment.organizationUnit,
              planCategory: appointment.planCategory,
              procedure: appointment.procedure,
              speciality: appointment.speciality,
              occupationArea: appointment.occupationArea,
              organizationUnitLocation: appointment.organizationUnitLocation,
              typeOfService: appointment.typeOfService,
            },
          });

          minifiedSchedules.appointmentList.push({
            appointmentCode: String(netpacsSchedule.idAtendimentoProcedimento),
            appointmentDate: this.netpacsServiceHelpersService.convertStartDate(
              netpacsSchedule.data,
              netpacsSchedule.horaInicial,
            ),
          });

          return {
            ...appointment,
            actions: flowActions,
          };
        }),
      );

      orderBy(schedules, 'appointmentDate', 'asc').forEach((schedule) => {
        if (moment(schedule.appointmentDate).valueOf() > moment().valueOf() && !minifiedSchedules.nextAppointment) {
          minifiedSchedules.nextAppointment = schedule;
        } else if (moment(schedule.appointmentDate).valueOf() <= moment().valueOf()) {
          minifiedSchedules.lastAppointment = schedule;
        }
      });

      await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
        minifiedSchedules,
        schedules,
      });

      return minifiedSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('NetpacsService.getMinifiedPatientSchedules', error);
    }
  }

  async getScheduleValue(integration: IntegrationDocument, scheduleValue: GetScheduleValue): Promise<AppointmentValue> {
    const { insurance, procedure } = scheduleValue;

    const payload: GetProcedureValueParams = {
      idPlanoConvenio: Number(insurance.planCode),
      dataString: moment().format('DD/MM/YYYY'),
      idProcedimento: Number(procedure.code),
    };

    try {
      const response = await this.netpacsApiService.getProcedureValue(integration, payload);

      if (!response?.valorProcedimento) {
        return null;
      }

      return {
        currency: 'R$',
        value: formatCurrency(response.valorProcedimento),
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('NetpacsService.getScheduleValue', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const entities = await this.netpacsApiService.listUnits(integration, null, true);

      if (entities?.length > 0) {
        return { ok: true };
      }
    } catch (error) {
      throw error;
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // busca agendamentos do paciente para pegar dados de qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('NetpacsService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      // Cria novo agendamento enquanto o anterior permanece ativo
      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);

      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'NetpacsService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const { procedure, appointmentCode, speciality } = appointmentToCancel;

      // após criar novo agendamento, cancela o anterior
      const cancelSchedulePayload = {
        appointmentCode,
        patientCode: patient.code,
        procedure: {
          code: null,
          specialityCode: procedure.specialityCode || speciality?.code,
          specialityType: procedure.specialityType || speciality?.specialityType,
        },
      };
      const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

      // caso o cancelamento do agendamento anterior falhe, cancela o que foi gerado no inicio do fluxo
      if (!canceledOldAppointment.ok) {
        const { appointmentCode, procedure, speciality } = createdAppointment;

        await this.cancelSchedule(integration, {
          appointmentCode,
          patientCode: patient.code,
          procedure: {
            code: procedure.code || null,
            specialityCode: procedure.specialityCode || speciality?.code,
            specialityType: procedure.specialityType || speciality?.specialityType,
          },
        });

        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'Error on cancel old appointment',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return createdAppointment;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.netpacsConfirmationService.getScheduleGuidance(integration, data);
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.netpacsConfirmationService.matchFlowsConfirmation(integration, data);
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.netpacsConfirmationService.listSchedulesToConfirm(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.netpacsConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.netpacsConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    data: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      return await this.netpacsConfirmationService.validateScheduleData(integration, data);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('NetpacsService.validateScheduleData', error);
    }
  }

  async getPatientFollowUpSchedules(integration: IntegrationDocument, filters: any): Promise<FollowUpAppointment[]> {
    const { patientCode } = filters;

    try {
      const response = await this.netpacsApiService.getFollowUpPatientAppointments(integration, {
        idPaciente: patientCode,
      });

      if (!response?.length) {
        return [];
      }

      const typeOfServiceFollowUp: TypeOfServiceEntityDocument = await this.entitiesService
        .getModel(EntityType.typeOfService)
        .findOne({
          'params.referenceTypeOfService': TypeOfService.followUp,
          integrationId: castObjectId(integration._id),
        });

      const schedules: FollowUpAppointment[] = await Promise.all(
        response
          // verificar se precisa do filter, pois se a rota ja vier filtrado, não será necessário
          .filter((schedule) => schedule.idProcedimentoRetorno && moment(schedule.dataLimiteRetorno).isAfter())
          .map(async (schedule) => {
            const relatedSchedule = await this.netpacsApiService.getAttendance(
              integration,
              schedule.idAtendimentoProcedimento?.toString(),
            );

            const replacedEntities = await this.entitiesService.createCorrelationFilterData(
              {
                procedure: schedule.idProcedimento?.toString(),
                doctor: schedule.idMedicoExecutor?.toString(),
                insurance: schedule.idConvenio?.toString(),
                insurancePlan: schedule.idPlanoConvenio?.toString(),
                organizationUnit: relatedSchedule.idUnidade?.toString(),
                speciality: relatedSchedule.idModalidade?.toString(),
              },
              'code',
              integration._id,
            );

            const followUpSchedule: FollowUpAppointment = {
              ...replacedEntities,
              followUpLimit: schedule.dataLimiteRetorno,
              appointmentDate: schedule.dataAgendamento,
              inFollowUpPeriod: moment(schedule.dataLimiteRetorno).isSameOrAfter(moment()),
              typeOfServiceFollowUp,
            };

            return followUpSchedule;
          }),
      );

      return schedules;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
}
