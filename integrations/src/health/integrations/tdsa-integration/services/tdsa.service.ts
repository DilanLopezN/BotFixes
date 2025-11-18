import { HttpStatus, Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectId } from '../../../../common/helpers/cast-objectid';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { defaultAppointmentTypes, defaultTypesOfService } from '../../../entities/default-entities';
import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  EntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  OrganizationUnitEntityDocument,
  ProcedureEntityDocument,
  ScheduleType,
  SpecialityEntityDocument,
  TypeOfService,
  TypeOfServiceEntityDocument,
} from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { TdsaAppointmentValueRequest } from '../../../integrations/tdsa-integration/interfaces/appointment.interface';
import {
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ValidateScheduleConfirmation,
} from '../../../integrator/interfaces';
import { CancelSchedule, CancelScheduleV2 } from '../../../integrator/interfaces/cancel-schedule.interface';
import { ConfirmSchedule, ConfirmScheduleV2 } from '../../../integrator/interfaces/confirm-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { GetScheduleValue } from '../../../integrator/interfaces/get-schedule-value.interface';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
  AvailableSchedulesMetadata,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
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
import {
  TdsaCreatePatient,
  TdsaCreateScheduleRequest,
  TdsaGetPatient,
  TdsaListAvailableSchedules,
  TdsaListAvailableSchedulesRequest,
  TdsaLockScheduleRequest,
  TdsaPatientAppointment,
  TdsaUpdatePatient,
} from '../interfaces';
import { TdsaApiService } from './tdsa-api.service';
import { TdsaConfirmationService } from './tdsa-confirmation.service';
import { TdsaHelpersService } from './tdsa-helpers.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { InterAppointmentService } from '../../../shared/inter-appointment.service';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';

type EntityFilters = { [key in EntityType]?: EntityTypes };
type RequestParams = { [key: string]: any };

@Injectable()
export class TdsaService implements IIntegratorService {
  constructor(
    private readonly apiService: TdsaApiService,
    private readonly helpersService: TdsaHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly confirmationService: TdsaConfirmationService,
    private readonly appointmentService: AppointmentService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly interAppointmentService: InterAppointmentService,
  ) {}

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = cancelSchedule;
      const canceledAppointmentCode: number = await this.apiService.cancelSchedule(integration, Number(scheduleCode));

      if (!canceledAppointmentCode) {
        return { ok: false };
      }

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = confirmSchedule;
      const confirmedAppointmentCode: number = await this.apiService.confirmSchedule(integration, Number(scheduleCode));

      if (!confirmedAppointmentCode) {
        return { ok: false };
      }

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.confirmSchedule', error);
    }
  }

  public async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // busca agendamentos do paciente para pegar dados de qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const scheduleToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!scheduleToCancel) {
        throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      // Cria novo agendamento enquanto o anterior permanece ativo
      const createdSchedule = await this.createSchedule(integration, scheduleToCreate);

      if (!createdSchedule.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.INTERNAL_SERVER_ERROR,
          {
            message: 'TdsaIntegrationService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const { appointmentCode } = scheduleToCancel;

      // após criar novo agendamento, cancela o anterior
      const canceledOldSchedule = await this.cancelSchedule(integration, {
        appointmentCode,
        patientCode: patient.code,
      });

      // caso o cancelamento do agendamento anterior falhe, cancela o que foi gerado no inicio do fluxo
      if (!canceledOldSchedule.ok) {
        const { appointmentCode } = createdSchedule;

        await this.cancelSchedule(integration, {
          appointmentCode,
          patientCode: patient.code,
        });

        throw HTTP_ERROR_THROWER(
          HttpStatus.INTERNAL_SERVER_ERROR,
          {
            message: 'Error on cancel old schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return createdSchedule;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async createSchedule(integration: IntegrationDocument, schedule: CreateSchedule): Promise<Appointment> {
    const { appointment, organizationUnit, insurance, procedure, doctor, patient, speciality, typeOfService } =
      schedule;

    let lockedScheduleId: number = null;
    let telemedicine = false;

    if (typeOfService) {
      const typeOfServiceEntity: TypeOfServiceEntityDocument = await this.entitiesService.getEntityByCode(
        typeOfService.code,
        EntityType.typeOfService,
        integration._id,
      );

      if (typeOfServiceEntity?.params?.referenceTypeOfService === TypeOfService.telemedicine) {
        telemedicine = true;
      }
    }

    try {
      const lockSchedulePayload: TdsaLockScheduleRequest = {
        IdUnidade: Number(organizationUnit.code),
        IdProcedimento: Number(procedure.code),
        IdProfissional: Number(doctor.code),
        Data: appointment.appointmentDate,
        IdConvenio: Number(insurance.code),
        IdEspecialidade: Number(speciality.code),
        IdPaciente: Number(patient.code),
        IdPlano: Number(insurance.planCode),
        IdProfissionalHorario: Number(schedule.appointment.data.appointmentDoctorCode),
        Telemedicina: telemedicine,
      };

      lockedScheduleId = await this.apiService.lockSchedule(integration, lockSchedulePayload);
    } catch (error) {
      if (lockedScheduleId) {
        await this.apiService.unLockSchedule(integration, lockedScheduleId);
      }
    }

    if (!lockedScheduleId) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.CONFLICT,
        'Unable to get blocked Schedule Id',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    try {
      // id do agendamento só existe depois de bloquear o horario na agenda
      const payload: TdsaCreateScheduleRequest = {
        Data: appointment.appointmentDate,
        IdAgendamento: lockedScheduleId,
        IdConvenio: Number(insurance.code),
        IdEspecialidade: Number(speciality.code),
        IdPaciente: Number(patient.code),
        IdPlano: Number(insurance.planCode),
        IdProcedimento: Number(procedure.code),
        IdUnidade: Number(organizationUnit.code),
        IdProfissional: Number(doctor.code),
        IdProfissionalHorario: Number(schedule.appointment.data.appointmentDoctorCode),
        Telemedicina: telemedicine,
      };

      if (patient.insuranceNumber) {
        payload.MatriculaConveniado = patient.insuranceNumber;
      }

      const scheduledId: number = await this.apiService.createSchedule(integration, payload);

      if (!!scheduledId) {
        return {
          appointmentDate: appointment.appointmentDate,
          appointmentCode: String(scheduledId),
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  public async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    const phone = formatPhone(convertPhoneNumber(patient.phone || patient.cellPhone), true);
    const cellPhone = formatPhone(convertPhoneNumber(patient.cellPhone || patient.phone), true);

    const payload: TdsaCreatePatient = {
      CPF: patient.cpf,
      Celular: cellPhone,
      Telefone: phone,
      DataNascimento: patient.bornDate,
      RG: patient.identityNumber,
      Nome: integration?.rules?.patientNameCase ? patient.name : patient.name.toUpperCase(),
      Sexo: this.helpersService.getPatientSexToTdsa(patient),
      Email: '',
    };

    if (patient.email) {
      payload.Email = patient.email;
    }

    try {
      const createdPatientId: number = await this.apiService.createPatient(integration, payload);
      const patient = await this.getPatient(integration, {
        cpf: undefined,
        code: String(createdPatientId),
      });

      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.createPatient', error);
    }
  }

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.extractEntity(integration, entityType, filter, cache);
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<{
    payload: TdsaListAvailableSchedulesRequest;
    interAppointmentPeriodApplied: number;
    doctorsScheduledMapped: Map<string, number>;
  }> {
    const { filter, patient } = availableSchedules;
    let { fromDay } = availableSchedules;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    let interAppointmentPeriodApplied: number = undefined;
    const doctorsScheduledMapped = new Map<string, number>();

    try {
      if (
        patient?.code &&
        filter.insurance?.code &&
        filter.appointmentType?.params?.referenceScheduleType === ScheduleType.Consultation
      ) {
        const [doctorsScheduledMap, interAppointmentPeriod] =
          await this.interAppointmentService.validateInsuranceInterAppointment(
            integration,
            filter,
            patient.code,
            this.getMinifiedPatientSchedules.bind(this),
            undefined,
            { method: 2 },
            availableSchedules.appointmentCodeToCancel ? [availableSchedules.appointmentCodeToCancel] : undefined,
          );

        doctorsScheduledMap.forEach((value, key) => {
          doctorsScheduledMapped.set(key, value);
        });

        if (interAppointmentPeriod > 0 && availableSchedules.fromDay < interAppointmentPeriod) {
          fromDay = interAppointmentPeriod;
          interAppointmentPeriodApplied = interAppointmentPeriod;
        }
      }
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, error);
    }

    const payload: TdsaListAvailableSchedulesRequest = {
      IdConvenio: Number(filter.insurance.code),
      IdEspecialidade: Number(filter.speciality.code),
      IdProcedimento: Number(filter.procedure.code),
      Telemedicina: false,
      IdUnidade: null,
      Data: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
    };

    if (filter.organizationUnit?.code) {
      payload.IdUnidade = Number(filter.organizationUnit.code);
    }

    if (filter.typeOfService?.params?.referenceTypeOfService === TypeOfService.telemedicine) {
      payload.Telemedicina = true;
    }

    if (!!filter.doctor?.code) {
      payload.IdProfissional = Number(filter.doctor.code);
    }

    if (!!filter.insurancePlan?.code) {
      payload.IdPlano = Number(filter.insurancePlan.code);
    }

    if (patient?.code) {
      payload.IdPaciente = Number(patient.code);
    }

    if (patient?.bornDate) {
      payload.IdadePaciente = moment().diff(patient.bornDate, 'years');
    }

    if (patient?.sex && (patient.sex === 'M' || patient.sex === 'F')) {
      payload.SexoPaciente = patient.sex;
    }

    return { payload, interAppointmentPeriodApplied, doctorsScheduledMapped };
  }

  public async splitGetAvailableSchedules(
    payload: TdsaListAvailableSchedulesRequest,
    availableSchedules: ListAvailableSchedules,
    integration: IntegrationDocument,
    interAppointmentPeriod: number,
  ): Promise<TdsaListAvailableSchedules[]> {
    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 1;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

    if (availableSchedules.dateLimit) {
      const diff = moment(availableSchedules.dateLimit).diff(moment(), 'days');
      availableSchedules.untilDay = diff;
    }

    const range = payload.IdProfissional ? 35 : 25;
    const requestsNumber = Math.ceil(range / maxRangeDays);
    const validOrganitionUnitIds: number[] = [];

    const response: TdsaListAvailableSchedules[] = [];

    if (integration.rules.listAvailableAppointmentFromAllActiveUnits) {
      const availableOrganizations = await this.entitiesService.getActiveEntities(
        EntityType.organizationUnit,
        null,
        integration._id,
      );
      validOrganitionUnitIds.push(...availableOrganizations.map((organization) => Number(organization.code)));
    } else {
      validOrganitionUnitIds.push(payload.IdUnidade);
    }

    const fromDay = interAppointmentPeriod || availableSchedules.fromDay;

    for (const organizationUnitId of validOrganitionUnitIds) {
      for (let stack = 0; stack < requestsNumber; stack++) {
        const newFromDay = moment(moment().add(fromDay, 'days').startOf('day'))
          .add(stack * maxRangeDays, 'days')
          .diff(moment().startOf('day'), 'days');

        const dynamicPayload = {
          ...payload,
          IdUnidade: organizationUnitId,
          Data: moment().add(newFromDay, 'days').startOf('day').format(dateFormat),
        };

        try {
          const data = await this.apiService.getAvailableSchedules(integration, dynamicPayload);
          data?.forEach((item) => {
            response.push({
              ...item,
              IdUnidade: organizationUnitId,
            });
          });
        } catch (error) {
          // Pula para a próxima unidade caso ocorra erro
          if (
            error?.response?.error?.includes('Campos obrigatórios') ||
            error?.response?.error?.includes('O profissional não está habilitado')
          ) {
            break;
          }
        }
      }
    }

    return response;
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const {
        filter,
        patient,
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        limit,
        periodOfDay,
      } = availableSchedules;

      const { payload, interAppointmentPeriodApplied, doctorsScheduledMapped } =
        await this.createListAvailableSchedulesObject(integration, availableSchedules);

      const metadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: interAppointmentPeriodApplied,
      };

      const results = await this.splitGetAvailableSchedules(
        payload,
        availableSchedules,
        integration,
        interAppointmentPeriodApplied,
      );

      if (!results?.length) {
        return { schedules: [], metadata };
      }

      const doctorsSet = new Set([]);

      if (filter.doctor?.code) {
        doctorsSet.add(filter.doctor.code);
      } else {
        results?.forEach((schedule) => doctorsSet.add(schedule.IdProfissional));
      }

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

      for await (const schedule of results) {
        if (doctorsMap[schedule.IdProfissional]) {
          const replacedSchedule: Appointment & { [key: string]: any } = {
            status: AppointmentStatus.scheduled,
            appointmentCode: String(schedule.IdProfissionalHorario),
            duration: '-1',
            appointmentDate: schedule.DataHora,
            procedureId: Number(filter.procedure.code),
            specialityId: Number(filter.speciality.code),
            doctorId: schedule.IdProfissional,
            organizationUnitId: Number(schedule.IdUnidade),
          };

          if (schedule.IdProfissionalHorario) {
            replacedSchedule.data = {
              ...(replacedSchedule.data ?? {}),
              appointmentDoctorCode: String(schedule.IdProfissionalHorario),
            };
          }

          const filteredInterAppointmentSchedules = this.interAppointmentService.filterInterAppointmentByDoctorCode(
            integration,
            replacedSchedule,
            doctorsScheduledMapped,
            filter,
          );

          if (filteredInterAppointmentSchedules) {
            replacedSchedules.push(filteredInterAppointmentSchedules);
          }
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
      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.getAvailableSchedules', error);
    }
  }

  public async getScheduleValue(
    integration: IntegrationDocument,
    appointmentValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    const { insurance, procedure, doctor } = appointmentValue;

    const payload: TdsaAppointmentValueRequest = {
      IdConvenio: Number(insurance.code),
      IdProcedimento: Number(procedure.code),
      IdPlano: Number(insurance.planCode),
      IdEmpresa: 1,
    };

    if (doctor?.code) {
      payload.IdProfissional = Number(doctor.code);
    }

    if (procedure?.specialityCode) {
      payload.IdEspecialidade = Number(procedure.specialityCode);
    }

    try {
      const appointmentValue: string = await this.apiService.getAppointmentValue(integration, payload);

      if (!appointmentValue) {
        return null;
      }

      return {
        currency: 'R$',
        value: formatCurrency(appointmentValue),
      };
    } catch (error) {
      throw error;
    }
  }

  private getResourceFilters(_: EntityType, filters: EntityFilters): RequestParams {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }

    // não são todas as rotas que utilizam os filtros enviados na request
    const params: RequestParams = {};

    if (filters.hasOwnProperty(EntityType.organizationUnit)) {
      params.IdUnidade = filters[EntityType.organizationUnit].code;
    }

    if (filters.hasOwnProperty(EntityType.insurance)) {
      params.IdConvenio = filters[EntityType.insurance].code;
    }

    if (filters.hasOwnProperty(EntityType.procedure)) {
      params.idProcedimento = filters[EntityType.procedure].code;
    }

    if (filters.hasOwnProperty(EntityType.speciality)) {
      params.IdEspecialidade = filters[EntityType.speciality].code;
    }

    if (filters.hasOwnProperty(EntityType.insurancePlan)) {
      params.IdPlano = filters[EntityType.insurancePlan].code;
    }

    return params;
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilters?: EntityFilters,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    const requestFilters = this.getResourceFilters(entityType, rawFilters);

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
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.getTypeOfServices', error);
    }
  }

  private async getAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return (
        defaultAppointmentTypes?.map((resource) => ({
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
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.getAppointmentTypes', error);
    }
  }

  private async getOrganizationUnits(integration: IntegrationDocument): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.apiService.getOrganizationUnits(integration);
      const entities = data?.map((resource) => {
        const entity: IOrganizationUnitEntity = {
          code: String(resource.Id),
          integrationId: castObjectId(integration._id),
          name: resource.Nome,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw error;
    }
  }

  private async getInsurances(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.apiService.getInsurances(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: String(resource.Id),
          integrationId: castObjectId(integration._id),
          name: String(resource.Nome),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw error;
    }
  }

  private async getInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      if (requestFilters.IdConvenio) {
        const data = await this.apiService.getInsurancePlans(integration, requestFilters);
        const entities = data?.map((resource) => {
          const entity: IInsurancePlanEntity = {
            code: String(resource.Id),
            integrationId: castObjectId(integration._id),
            name: String(resource.Nome),
            source: EntitySourceType.erp,
            activeErp: true,
            version: EntityVersionType.production,
            insuranceCode: String(requestFilters.IdConvenio),
          };

          return entity;
        });

        return entities ?? [];
      }

      const insurances = await this.apiService.getInsurances(integration);

      if (!insurances.length) {
        return [];
      }

      const entities: IInsurancePlanEntity[] = [];

      for await (const insurance of insurances) {
        requestFilters.IdConvenio = insurance.Id;
        const insurancePlans = await this.apiService.getInsurancePlans(integration, requestFilters);

        if (!insurancePlans.length) {
          return;
        }

        for await (const insurancePlan of insurancePlans) {
          const entity: IInsurancePlanEntity = {
            code: String(insurancePlan.Id),
            integrationId: castObjectId(integration._id),
            name: String(insurancePlan.Nome),
            source: EntitySourceType.erp,
            activeErp: true,
            version: EntityVersionType.production,
            insuranceCode: String(insurance.Id),
          };

          entities.push(entity);
        }
      }

      return entities;
    } catch (error) {
      throw error;
    }
  }

  private async getProcedures(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IProcedureEntity[]> {
    try {
      const data = await this.apiService.getProcedures(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: IProcedureEntity = {
          code: String(resource.Id),
          integrationId: castObjectId(integration._id),
          name: resource.Nome,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          specialityType: SpecialityTypes.C,
          specialityCode: resource?.Especialidades?.[0]?.Id ? String(resource.Especialidades[0].Id) : '-1',
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw error;
    }
  }

  private async getSpecialities(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.apiService.getSpecialities(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: ISpecialityEntity = {
          code: String(resource.Id),
          integrationId: castObjectId(integration._id),
          name: resource.Nome,
          activeErp: true,
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
          specialityType: SpecialityTypes.C,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw error;
    }
  }

  private async getDoctors(integration: IntegrationDocument, requestFilters: RequestParams): Promise<IDoctorEntity[]> {
    try {
      const data = await this.apiService.getDoctors(integration, requestFilters);
      const entities = data?.map((resource) => {
        const entity: IDoctorEntity = {
          code: String(resource.Id),
          integrationId: castObjectId(integration._id),
          name: resource.Nome,
          activeErp: true,
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
        };

        return entity;
      });

      return entities ?? [];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.appointmentType,
        filters,
        cache,
      )) as IAppointmentTypeEntity[];
      const codes = data?.map((appointmentType) => appointmentType.code);
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
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.organizationUnit,
        filters,
        cache,
      )) as IOrganizationUnitEntity[];
      const codes = data?.map((organization) => organization.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.organizationUnit,
      )) as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiSpecialities(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.speciality,
        filters,
        cache,
      )) as ISpecialityEntity[];
      const codes = data?.map((speciality) => speciality.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.speciality,
      )) as SpecialityEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiInsurances(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.insurance, filters, cache)) as IInsuranceEntity[];
      const codes = data?.map((insurance) => insurance.code);
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
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.procedure, filters, cache)) as IProcedureEntity[];
      const codes = data?.map((procedure) => procedure.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.procedure,
      )) as ProcedureEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.doctor, filters, cache)) as IDoctorEntity[];
      const codes = data?.map((doctor) => doctor.code);
      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.doctor,
      )) as DoctorEntityDocument[];
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
      )) as InsurancePlanEntityDocument[];
      const codes = data?.map((insurancePlan) => insurancePlan.code);

      return (await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurancePlan,
      )) as InsurancePlanEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async listValidApiEntities<T>(
    integration: IntegrationDocument,
    targetEntity: EntityType,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<T[]> {
    try {
      const data = await this.extractEntity(integration, targetEntity, filters, cache);
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

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, targetEntity);

      if (cache && entities?.length) {
        await this.integrationCacheUtilsService.setProcessedEntities(integration, targetEntity, entities, codes);
      }

      return entities as unknown as T[];
    } catch (error) {
      throw error;
    }
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
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
        return await this.resolveListValidApiDoctors(integration, rawFilter, cache, patient);

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

      case EntityType.typeOfService:
        return await this.listValidApiEntities<TypeOfServiceEntityDocument>(
          integration,
          targetEntity,
          rawFilter,
          cache,
        );

      default:
        return [] as EntityDocument[];
    }
  }

  private async getValidDoctorsFromScheduleList(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    const availableSchedules: ListAvailableSchedules = {
      filter,
      randomize: false,
      limit: 40,
      period: {
        start: '00:00',
        end: '23:59',
      },
      fromDay: 1,
      untilDay: 30,
      patient: {
        bornDate: patient?.bornDate,
        sex: patient?.sex,
        cpf: patient?.cpf,
      },
    };

    try {
      const { payload } = await this.createListAvailableSchedulesObject(integration, availableSchedules);
      const results = await this.splitGetAvailableSchedules(payload, availableSchedules, integration, 0);

      if (!results?.length) {
        return [];
      }

      const doctorsSet = new Set<string>();
      results.forEach((result) => doctorsSet.add(String(result.IdProfissional)));

      if (!doctorsSet.size) {
        return [];
      }

      return await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.getValidDoctorsFromScheduleList', error);
    }
  }

  public async resolveListValidApiDoctors(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    cache?: boolean,
    patient?: InitialPatient,
  ) {
    if (integration.rules.listOnlyDoctorsWithAvailableSchedules) {
      return await this.getValidDoctorsFromScheduleList(integration, filters, patient);
    }

    return await this.getValidApiDoctors(integration, filters, cache);
  }

  public async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const appointments: TdsaPatientAppointment[] = await this.apiService.getPatientSchedules(
        integration,
        patientCode,
      );

      if (!appointments?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        appointments.map(async (tdsaSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(integration, [
            this.helpersService.createPatientAppointmentObject(tdsaSchedule),
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
            appointmentCode: String(tdsaSchedule.IdAgendamento),
            appointmentDate: tdsaSchedule.Data,
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
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.getMinifiedPatientSchedules', error);
    }
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  public async getPatient(
    integration: IntegrationDocument,
    filters: PatientFilters,
    ignoreCache?: boolean,
  ): Promise<Patient> {
    const { cpf, code } = filters;

    if (!ignoreCache) {
      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);
      if (patientCache) {
        return patientCache;
      }
    }

    let patient: Patient;

    if (!!cpf) {
      const data: TdsaGetPatient = await this.apiService.getPatient(integration, cpf);
      patient = this.helpersService.replacePatient(data);
    } else if (!!code) {
      const data: TdsaGetPatient = await this.apiService.getPatient(integration, undefined, code);
      patient = this.helpersService.replacePatient(data);
    }

    await this.integrationCacheUtilsService.setPatientCache(integration, patient?.code, cpf, patient);
    return patient;
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;
    try {
      const schedules: TdsaPatientAppointment[] = await this.apiService.getPatientSchedules(integration, patientCode);

      if (!schedules?.length) {
        return [];
      }

      const rawSchedules: RawAppointment[] = [];
      schedules.map((schedule) => {
        rawSchedules.push(this.helpersService.createPatientAppointmentObject(schedule));
      });

      return await this.appointmentService.transformSchedules(integration, rawSchedules);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.getPatientSchedules', error);
    }
  }

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const entities = await this.apiService.getOrganizationUnits(integration, true);

      if (entities?.length > 0) {
        return { ok: true };
      }
    } catch (error) {
      throw error;
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    const phone = formatPhone(convertPhoneNumber(patient.phone || patient.cellPhone), true);
    const cellPhone = formatPhone(convertPhoneNumber(patient.cellPhone || patient.phone), true);

    const payload: TdsaUpdatePatient = {
      CPF: patient.cpf,
      Celular: cellPhone,
      Telefone: phone,
      DataNascimento: patient.bornDate,
      RG: '',
      Email: '',
      Nome: integration?.rules?.patientNameCase ? patient.name : patient.name.toUpperCase(),
      Sexo: this.helpersService.getPatientSexToTdsa(patient),
      Id: patientCode,
    } as TdsaUpdatePatient;

    if (patient.email) {
      payload.Email = patient.email;
    }

    if (patient.identityNumber) {
      payload.RG = patient.identityNumber;
    }

    try {
      await this.apiService.updatePatient(integration, payload);
      const patient = await this.getPatient(
        integration,
        {
          cpf: undefined,
          code: String(patientCode),
        },
        true,
      );

      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaIntegrationService.updatePatient', error);
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.confirmationService.matchFlowsConfirmation(integration, data);
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.confirmationService.getScheduleGuidance(integration, data);
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.confirmationService.listSchedulesToConfirm(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.confirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.confirmationService.confirmSchedule(integration, confirmSchedule);
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    data: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      return await this.confirmationService.validateScheduleData(integration, data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaService.validateScheduleData', error);
    }
  }
}
