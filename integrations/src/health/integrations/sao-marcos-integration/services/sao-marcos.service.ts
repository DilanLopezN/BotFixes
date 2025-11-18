import { HttpStatus, Injectable } from '@nestjs/common';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  EntityDocument,
  InsuranceEntityDocument,
  ProcedureEntityDocument,
  OrganizationUnitEntityDocument,
  SpecialityEntityDocument,
  InsurancePlanEntityDocument,
} from '../../../entities/schema';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CancelSchedule, CancelScheduleV2 } from '../../../integrator/interfaces/cancel-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
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
import {
  SaoMarcosAvailableSchedules,
  SaoMarcosAvailableSchedulesResponse,
  SaoMarcosCreatePatienResponse,
  SaoMarcosCreateSchedule,
  SaoMarcosDoctorsParamsRequest,
  SaoMarcosGetPatientResponse,
  SaoMarcosInsurancePlansParamsRequest,
  SaoMarcosInsurancesParamsRequest,
  SaoMarcosPatientSchedulesResponse,
  SaoMarcosProceduresParamsRequest,
  SaoMarcosReschedule,
  SaoMarcosSpecialitiesParamsRequest,
  SaoMarcosUpdatePatient,
  SaoMarcosUpdatePatientResponse,
} from '../interfaces';
import { SaoMarcosApiService } from './sao-marcos-api.service';
import { SaoMarcosHelpersService } from './sao-marcos-helpers.service';
import * as moment from 'moment';
import { orderBy } from 'lodash';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { defaultTypesOfService } from '../../../entities/default-entities';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { betweenDate } from '../../../../common/helpers/between';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { SaoMarcosConfirmationService } from './sao-marcos-confirmation.service';
import {
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
} from '../../../integrator/interfaces';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';

type RequestParams = { [key: string]: any };

@Injectable()
export class SaoMarcosService implements IIntegratorService {
  constructor(
    private readonly saoMarcosApiService: SaoMarcosApiService,
    private readonly saoMarcosConfirmationService: SaoMarcosConfirmationService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly saoMarcosHelpersService: SaoMarcosHelpersService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode } = cancelSchedule;

    try {
      await this.saoMarcosApiService.cancelSchedule(integration, {
        codigo: appointmentCode,
      });

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'SaoMarcosService.confirmSchedule: Not implemented');
  }

  public async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, insurance, procedure, patient } = createSchedule;
      const procedureData = this.saoMarcosHelpersService.getCompositeProcedureCode(procedure.code);

      const payload: SaoMarcosCreateSchedule = {
        codigoPaciente: patient.code,
        horario: {
          codigo: appointment.code,
          convenio: {
            codigo: insurance.code,
            codigoPlano: insurance.planCode,
          },
          procedimento: {
            codigo: procedureData.code,
            codigoEspecialidade: procedure.specialityCode,
          },
          dataHoraAgendamento: appointment.appointmentDate,
        },
      };

      const response = await this.saoMarcosApiService.createSchedule(integration, payload);

      if (response) {
        return {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          appointmentCode: appointment.code,
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.createSchedule', error);
    }
  }

  public async createPatient(integration: IntegrationDocument, createPatient: CreatePatient): Promise<Patient> {
    try {
      const payload = this.saoMarcosHelpersService.createPatientPayload(createPatient);
      const response: SaoMarcosCreatePatienResponse = await this.saoMarcosApiService.createPatient(
        integration,
        payload,
      );

      const patient = this.saoMarcosHelpersService.replaceSaoMarcosPatient(response);

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      }

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.createPatient', error);
    }
  }

  private async getOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getOrganizationUnits(integration);
      return (
        data?.map((resource) => {
          const { endereco } = resource;
          const entity: IOrganizationUnitEntity = {
            code: String(resource.codigo),
            integrationId: castObjectId(integration._id),
            name: resource.nome,
            source: EntitySourceType.erp,
            activeErp: true,
            version: EntityVersionType.production,
            data: {
              address: `${endereco.cidade} - ${endereco.numero}, ${endereco.bairro} - ${endereco.cidade}, ${endereco.cep}`,
            },
          };

          return entity;
        }) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getOrganizationUnits', error);
    }
  }

  private async getInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: SaoMarcosInsurancePlansParamsRequest,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getInsurancePlans(integration, requestFilters);
      return (
        data?.map((resource) => ({
          code: String(resource.codigo),
          integrationId: castObjectId(integration._id),
          name: String(resource.nome),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          insuranceCode: resource.codigoConvenio,
        })) ?? []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getInsurancePlans', error);
    }
  }

  private async getInsurances(
    integration: IntegrationDocument,
    requestFilters: SaoMarcosInsurancesParamsRequest,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getInsurances(integration, requestFilters);
      return data?.map((resource) => ({
        code: String(resource.codigo),
        integrationId: castObjectId(integration._id),
        name: String(resource.nome),
        source: EntitySourceType.erp,
        activeErp: true,
        version: EntityVersionType.production,
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getInsurances', error);
    }
  }

  private async getSpecialities(
    integration: IntegrationDocument,
    requestFilters: SaoMarcosSpecialitiesParamsRequest,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getSpecialities(integration, requestFilters);
      return data?.map((resource) => ({
        code: String(resource.codigo),
        integrationId: castObjectId(integration._id),
        name: resource.nome,
        activeErp: true,
        source: EntitySourceType.erp,
        version: EntityVersionType.production,
        specialityType: resource.tipoAgendamento as SpecialityTypes,
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getSpecialities', error);
    }
  }

  private async getDoctors(
    integration: IntegrationDocument,
    requestFilters: SaoMarcosDoctorsParamsRequest,
  ): Promise<IDoctorEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getDoctors(integration, requestFilters);
      return data?.map((resource) => ({
        code: String(resource.codigo),
        integrationId: castObjectId(integration._id),
        name: resource.nome,
        activeErp: true,
        source: EntitySourceType.erp,
        version: EntityVersionType.production,
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getDoctors', error);
    }
  }

  private async getProcedures(
    integration: IntegrationDocument,
    requestFilters: SaoMarcosProceduresParamsRequest,
  ): Promise<IProcedureEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getProcedures(integration, requestFilters);
      return data?.map((resource) => ({
        code: this.saoMarcosHelpersService.createCompositeProcedureCode(
          resource.codigo,
          resource.codigoEspecialidade,
          resource.tipoEspecialidade,
        ),
        integrationId: castObjectId(integration._id),
        name: resource.nome,
        activeErp: true,
        source: EntitySourceType.erp,
        version: EntityVersionType.production,
        specialityCode: String(resource.codigoEspecialidade),
        specialityType: resource.tipoEspecialidade as SpecialityTypes,
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getProcedures', error);
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
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getTypeOfServices', error);
    }
  }

  private async getAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      const data = await this.saoMarcosApiService.getAppointmentTypes(integration);
      return data?.map((resource) => ({
        code: String(resource.codigo),
        integrationId: castObjectId(integration._id),
        name: resource.nome,
        activeErp: true,
        source: EntitySourceType.erp,
        version: EntityVersionType.production,
      }));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getAppointmentTypes', error);
    }
  }

  private getResourceFilters(_: EntityType, filters: CorrelationFilter): RequestParams {
    if (!filters || !Object.keys(filters).length) {
      return undefined;
    }

    // não são todas as rotas que utilizam os filtros enviados na request
    const params: RequestParams = {};

    if (filters.hasOwnProperty(EntityType.insurance)) {
      params.codigoConvenio = filters.insurance.code;
    }

    if (filters.hasOwnProperty(EntityType.speciality)) {
      params.codigoEspecialidade = filters.speciality.code;
    }

    if (filters.hasOwnProperty(EntityType.insurancePlan)) {
      params.codigoPlano = filters.insurancePlan.code;
    }

    if (filters.hasOwnProperty(EntityType.procedure)) {
      const procedureData = this.saoMarcosHelpersService.getCompositeProcedureCode(filters.procedure.code);
      params.codigoProcedimento = procedureData.code;
      params.codigoEspecialidade = filters.procedure.specialityCode;
    }

    return params;
  }

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.appointmentType, filters, cache);
      const appointmentTypeCodes: string[] = data?.map((appointmentType) => appointmentType.code) ?? [];
      return await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        appointmentTypeCodes,
        EntityType.appointmentType,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiAppointmentTypes', error);
    }
  }

  private async getValidApiSpecialities(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.speciality, filters, cache);
      const specialityCodes: string[] = data?.map((speciality) => speciality.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        specialityCodes,
        EntityType.speciality,
      )) as SpecialityEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiSpecialities', error);
    }
  }

  private async getValidApiOrganizationUnits(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.organizationUnit, filters, cache);
      const organizationCodes = data?.map((organization) => organization.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        organizationCodes,
        EntityType.organizationUnit,
      )) as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiOrganizationUnits', error);
    }
  }

  private async getValidApiInsurances(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.insurance, filters, cache);
      const insuranceCodes = data?.map((insurance) => insurance.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        insuranceCodes,
        EntityType.insurance,
      )) as InsuranceEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiInsurances', error);
    }
  }

  private async getValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<InsurancePlanEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.insurancePlan, filters, cache);
      const insurancePlanCodes = data?.map((insurancePlan) => insurancePlan.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        insurancePlanCodes,
        EntityType.insurancePlan,
      )) as InsurancePlanEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiInsurancePlans', error);
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.doctor, filters, cache);
      const doctorCodes = data?.map((doctor) => doctor.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        doctorCodes,
        EntityType.doctor,
      )) as DoctorEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiDoctors', error);
    }
  }

  private async getValidApiProcedures(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.procedure, filters, cache);
      const procedureCodes = data?.map((procedure) => procedure.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        procedureCodes,
        EntityType.procedure,
      )) as ProcedureEntityDocument[];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getValidApiProcedures', error);
    }
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilters?: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, rawFilters);

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
      );

      if (resourceCache) {
        return resourceCache;
      }
    }

    const getResource = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return this.getOrganizationUnits(integration);

        case EntityType.insurance:
          return this.getInsurances(integration, requestFilters);

        case EntityType.insurancePlan:
          return this.getInsurancePlans(integration, requestFilters);

        case EntityType.doctor:
          return this.getDoctors(integration, requestFilters);

        case EntityType.speciality:
          return this.getSpecialities(integration, requestFilters);

        case EntityType.appointmentType:
          return this.getAppointmentTypes(integration);

        case EntityType.procedure:
          return this.getProcedures(integration, requestFilters);

        case EntityType.typeOfService:
          return this.getTypeOfServices(integration);

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

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.extractEntity(integration, entityType, filter, cache);
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const {
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        filter,
        fromDay = 0,
        untilDay,
        patient,
        limit,
        periodOfDay,
      } = availableSchedules;

      const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
      const procedureData = this.saoMarcosHelpersService.getCompositeProcedureCode(filter.procedure.code);

      const payload: SaoMarcosAvailableSchedules = {
        convenio: {
          codigo: filter.insurance.code,
          codigoPlano: filter.insurancePlan.code,
        },
        procedimento: {
          codigo: procedureData.code,
          tipoEspecialidade: filter.procedure.specialityType,
          codigoEspecialidade: filter.speciality.code,
        },
        dataHoraInicio: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
        dataHoraFim: moment()
          .add(fromDay + untilDay, 'days')
          .endOf('day')
          .format(dateFormat),
        horaDiaInicio: '00:00',
        horaDiaFim: '23:59',
      };

      if (filter.doctor?.code) {
        payload.medicos = [{ codigo: filter.doctor.code }];
      }

      // se não tem médico para filtar tenta encontrar médicos da área de atuação selecionada para
      // enviar na request, se não tiver nenhuma não filtra
      if (!filter?.doctor?.code && filter?.occupationArea?._id) {
        const entities = await this.entitiesService.getCollection(EntityType.doctor).find({
          'references.refId': { $in: [filter.occupationArea._id] },
          'references.type': EntityType.occupationArea,
          integrationId: castObjectId(integration._id),
        });

        if (!entities.length) {
          return;
        }

        payload.medicos.push(...entities.map((entity) => ({ codigo: entity.code })));
      }

      if (patient?.code) {
        payload.codigoPaciente = patient.code;
      }

      const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
        periodOfDay: availableSchedules.periodOfDay,
        limit: availableSchedules.limit,
        sortMethod: availableSchedules.sortMethod,
        randomize: availableSchedules.randomize,
        period: availableSchedules.period,
      });

      if (period) {
        payload.horaDiaInicio = start;
        payload.horaDiaFim = end;
      }

      const schedules: SaoMarcosAvailableSchedulesResponse[] = await this.saoMarcosApiService.getAvailableSchedules(
        integration,
        payload,
      );

      const doctorsSet = new Set([]);
      schedules?.forEach((schedule) => doctorsSet.add(schedule.idMedico));

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
        { canSchedule: true },
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

      const replacedSchedules: RawAppointment[] = [];

      for await (const schedule of schedules || []) {
        if (doctorsMap[schedule.idMedico]) {
          const replacedAppointment: Appointment & { [key: string]: any } = {
            appointmentCode: schedule.codigo,
            appointmentDate: schedule.dataHoraAgendamento,
            duration: schedule.duracao,
            procedureId: schedule.idProcedimento,
            doctorId: schedule.idMedico,
            organizationUnitId: filter.organizationUnit?.code ?? '1',
            status: AppointmentStatus.scheduled,
          };

          if (schedule.aviso) {
            replacedAppointment.warning = schedule.aviso?.trim();
          }

          replacedSchedules.push(replacedAppointment);
        }
      }

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
          replacedSchedules,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getAvailableSchedules', error);
    }
  }

  public async getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'SaoMarcosService.getScheduleValue: Not implemented',
      undefined,
      true,
    );
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

  public async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode, startDate, endDate } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const saoMarcosSchedules: SaoMarcosPatientSchedulesResponse[] =
        await this.saoMarcosApiService.getPatientSchedules(integration, { codigoPaciente: patientCode });

      if (!saoMarcosSchedules?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        saoMarcosSchedules
          .filter((saoMarcosSchedule) => {
            let canReturnAppointment = true;

            if (!startDate && !endDate) {
              return true;
            }

            // Convertendo nossas datas (GMT-3) para GMT - servidor sao marcos trabalha nesta timezone
            const startDateConvert = startDate ? moment(startDate).subtract(3, 'hours').valueOf() : startDate;
            const endDateConvert = endDate ? moment(endDate).subtract(3, 'hours').valueOf() : endDate;

            canReturnAppointment = betweenDate(
              saoMarcosSchedule.horario?.dataHoraAgendamento,
              startDateConvert,
              endDateConvert,
            );
            return canReturnAppointment;
          })
          .map(async (saoMarcosSchedule) => {
            const [schedule] = await this.appointmentService.transformSchedules(integration, [
              this.saoMarcosHelpersService.createPatientAppointmentObject(saoMarcosSchedule),
            ]);

            const flowSteps = [FlowSteps.listPatientSchedules];

            if (patientSchedules.target) {
              flowSteps.push(patientSchedules.target);
            }

            const flowActions = await this.flowService.matchFlowsAndGetActions({
              integrationId: integration._id,
              targetFlowTypes: flowSteps,
              entitiesFilter: {
                appointmentType: schedule.appointmentType,
                doctor: schedule.doctor,
                insurance: schedule.insurance,
                insurancePlan: schedule.insurancePlan,
                insuranceSubPlan: schedule.insuranceSubPlan,
                organizationUnit: schedule.organizationUnit,
                planCategory: schedule.planCategory,
                procedure: schedule.procedure,
                speciality: schedule.speciality,
                occupationArea: schedule.occupationArea,
                organizationUnitLocation: schedule.organizationUnitLocation,
                typeOfService: schedule.typeOfService,
              },
            });

            minifiedSchedules.appointmentList.push({
              appointmentCode: String(saoMarcosSchedule.codigoAtendimento),
              appointmentDate: saoMarcosSchedule.horario.dataHoraAgendamento,
            });

            return {
              ...schedule,
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
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getMinifiedPatientSchedules', error);
    }
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

    if (patientCache && cache) {
      return patientCache;
    }

    let patient: Patient;

    if (!!cpf) {
      const data: SaoMarcosGetPatientResponse = await this.saoMarcosApiService.getPatientByCpf(integration, cpf);
      patient = this.saoMarcosHelpersService.replaceSaoMarcosPatient(data);
    } else if (!!code) {
      const data: SaoMarcosGetPatientResponse = await this.saoMarcosApiService.getPatientByCode(integration, code);
      patient = this.saoMarcosHelpersService.replaceSaoMarcosPatient(data);
    }

    await this.integrationCacheUtilsService.setPatientCache(integration, code, cpf, patient);
    return patient;
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;
    try {
      const schedules: SaoMarcosPatientSchedulesResponse[] = await this.saoMarcosApiService.getPatientSchedules(
        integration,
        { codigoPaciente: patientCode },
      );

      if (!schedules?.length) {
        return [];
      }

      const rawSchedules: RawAppointment[] = schedules
        .filter((saoMarcosSchedule) => {
          let canReturnAppointment = true;

          if (!startDate && !endDate) {
            return true;
          }

          // Convertendo nossas datas (GMT-3) para GMT - servidor sao marcos trabalha nesta timezone
          const startDateConvert = startDate ? moment(startDate).subtract(3, 'hours').valueOf() : startDate;
          const endDateConvert = endDate ? moment(endDate).subtract(3, 'hours').valueOf() : endDate;

          canReturnAppointment = betweenDate(
            saoMarcosSchedule.horario?.dataHoraAgendamento,
            startDateConvert,
            endDateConvert,
          );
          return canReturnAppointment;
        })
        .map((saoMarcosSchedule) => this.saoMarcosHelpersService.createPatientAppointmentObject(saoMarcosSchedule));

      return await this.appointmentService.transformSchedules(integration, rawSchedules);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getPatientSchedules', error);
    }
  }

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const entities = await this.getOrganizationUnits(integration);

      if (entities?.length) {
        return { ok: true };
      }
    } catch (error) {
      throw error;
    }
  }

  public async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    try {
      // busca agendamentos do paciente para pegar dados de qual será cancelado
      let patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });

      // caso não tenha agendamentos, busca agendamentos passados
      // provavel resgate noshow
      if (!patientAppointments || !patientAppointments.length) {
        const saoMarcosListSchedules = await this.saoMarcosApiService.listSchedules(integration, {
          dataInicioBusca: moment().subtract(10, 'days').format(dateFormat),
          dataFimBusca: moment().format(dateFormat),
          codigoPaciente: patient.code,
          status: '0',
        });

        const saoMarcosAppointmentObject = saoMarcosListSchedules.map((schedule) => {
          const scheduleToObject = this.saoMarcosHelpersService.createPatientAppointmentObject({
            codigoAtendimento: schedule.codigoAtendimento,
            horario: {
              dataHoraAgendamento: schedule.dataHorario,
              status: schedule.status,
            },
            codigoMedico: schedule.medico.codigo,
            codigoEspecialidade: schedule.especialidade.codigo,
            codigoConvenio: schedule.convenio.codigo,
            codigoPlano: schedule.plano.codigo,
            codigoProcedimento: schedule.procedimento.codigo,
            atualizadoPor: '',
          });

          // Por padrão status do createPatientAppointmentObject é scheduled (id 1)
          // mas o status de listSchedules vem do cancelamento
          return { ...scheduleToObject, status: AppointmentStatus.canceled };
        });

        patientAppointments = await this.appointmentService.transformSchedules(integration, saoMarcosAppointmentObject);

        if (!patientAppointments || !patientAppointments.length) {
          throw INTERNAL_ERROR_THROWER('SaoMarcosService.reschedule', {
            message: 'Invalid appointment code to cancel',
          });
        }
      }

      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('SaoMarcosService.reschedule', {
          message: 'No appointment to cancel',
        });
      }

      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);
      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'SaoMarcosService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const { procedure, appointmentCode, speciality } = appointmentToCancel;
      const cancelSchedulePayload = {
        appointmentCode,
        patientCode: patient.code,
        procedure: {
          code: null,
          specialityCode: procedure?.specialityCode || speciality?.code,
          specialityType: procedure?.specialityType || speciality?.specialityType,
        },
      };
      const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

      if (procedure?.code) {
        const procedureData = this.saoMarcosHelpersService.getCompositeProcedureCode(procedure.code);
        cancelSchedulePayload.procedure.code = procedureData.code;
      }

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
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.reschedule', error);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    updatePatient: UpdatePatient,
  ): Promise<Patient> {
    try {
      const payload = this.saoMarcosHelpersService.createPatientPayload(updatePatient) as SaoMarcosUpdatePatient;

      if (!payload.codigo) {
        payload.codigo = patientCode;
      }

      const response: SaoMarcosUpdatePatientResponse = await this.saoMarcosApiService.updatePatient(
        integration,
        payload,
      );

      const patient = this.saoMarcosHelpersService.replaceSaoMarcosPatient(response);

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      }

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.updatePatient', error);
    }
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.saoMarcosConfirmationService.listSchedulesToConfirm(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.saoMarcosConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.saoMarcosConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.saoMarcosConfirmationService.getScheduleGuidance(integration, data);
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    return await this.saoMarcosConfirmationService.getConfirmationScheduleById(integration, data);
  }
}
