import { HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { DoctorEntityDocument, EntityDocument } from '../../../entities/schema';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelSchedule,
  CancelScheduleV2,
  ConfirmSchedule,
  ConfirmScheduleV2,
  CreateSchedule,
  IIntegratorService,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  ListSchedulesToConfirm,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  PatientFilters,
  PatientSchedules,
  Reschedule,
  UpdatePatient,
} from '../../../integrator/interfaces';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { FlowAction, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { AmigoApiService } from './amigo-api.service';
import { AmigoEntitiesService } from './amigo-entities.service';
import { AmigoHelpersService } from './amigo-helpers.service';
import { orderBy } from 'lodash';
import { EntitiesService } from '../../../entities/services/entities.service';
import { MatchFlowActions } from '../../../flow/interfaces/match-flow-actions';
import { FlowService } from '../../../flow/service/flow.service';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { formatPhone } from '../../../../common/helpers/format-phone';
import {
  AmigoCreateScheduleParamsRequest,
  AmigoStatusScheduleParamsRequest,
} from '../interfaces/base-register.interface';
import { AmigoConfirmationService, ConfirmOrCancelConfirmation } from './amigo-confirmation.service';
import { ConfirmationSchedule } from 'health/interfaces/confirmation-schedule.interface';

enum ScheduleStatusEnum {
  confirmed = 'confirmed',
  scheduled = 'scheduled',
  canceled = 'canceled',
  arrived = 'arrived',
}

@Injectable()
export class AmigoService implements IIntegratorService {
  constructor(
    private readonly amigoApiService: AmigoApiService,
    private readonly amigoConfirmationService: AmigoConfirmationService,
    private readonly amigoHelpersService: AmigoHelpersService,
    private readonly amigoEntitiesService: AmigoEntitiesService,
    private readonly entitiesService: EntitiesService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly appointmentService: AppointmentService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly flowService: FlowService,
  ) {}

  getScheduleValue(): Promise<AppointmentValue> {
    return null;
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const entities = await this.amigoApiService.listOrganizationUnits(integration);
      if (entities?.length) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.getStatus.name, error);
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('AmigoIntegrationService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      const createdAppointment = await this.createSchedule(integration, {
        ...scheduleToCreate,
        appointment: {
          ...scheduleToCreate.appointment,
          appointmentDate: moment(scheduleToCreate.appointment.appointmentDate).format(),
        },
      });

      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'AmigoIntegrationService.reschedule: error creating new schedule',
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
          specialityCode: procedure.specialityCode || speciality?.code,
          specialityType: procedure.specialityType || speciality?.specialityType,
        },
      };
      const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

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

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode, patientCode } = cancelSchedule;
    return this.updateStatus(integration, {
      status: ScheduleStatusEnum.canceled,
      patient_id: patientCode,
      attendance_id: appointmentCode,
    });
  }

  confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { appointmentCode, patientCode } = confirmSchedule;
    return this.updateStatus(integration, {
      status: ScheduleStatusEnum.confirmed,
      patient_id: patientCode,
      attendance_id: appointmentCode,
    });
  }

  async updateStatus(integration, params: AmigoStatusScheduleParamsRequest) {
    try {
      await this.amigoApiService.updateStatusSchedule(integration, params);
    } catch (error) {
      const isAlreadyConfirmedOrCanceled = error?.response?.error?.message?.includes(
        'Não é possível modificar o status de um atendimento finalizado, cancelado ou marcado como faltante.',
      );

      if (!isAlreadyConfirmedOrCanceled) {
        throw error;
      }
    }

    return { ok: true };
  }

  async createPatient(integration: IntegrationDocument, patient: CreatePatient): Promise<Patient> {
    try {
      const { bornDate, cellPhone, ...patientData } = patient.patient;
      try {
        const existPatient = await this.getPatient(integration, { cpf: patientData.cpf });
        return existPatient;
      } catch (error) {
        const response = await this.amigoApiService.createPatient(integration, {
          ...patientData,
          contact_cellphone: formatPhone(cellPhone, true),
          born: moment(bornDate).format('DD/MM/YYYY'),
        });
        return this.amigoHelpersService.replaceAmigoPatientToPatient(response);
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.createPatient.name, error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { patient, procedure, insurance, organizationUnit, doctor, appointment } = createSchedule;

      const payload: AmigoCreateScheduleParamsRequest = {
        patient_id: Number(patient?.code),
        event_id: Number(procedure?.code),
        insurance_id: Number(insurance?.code),
        place_id: Number(organizationUnit?.code),
        user_id: Number(doctor?.code),
        start_date: moment(appointment.appointmentDate).add(3, 'hours').format(),
      };

      const result = await this.amigoApiService.createSchedule(integration, payload);

      if (result?.consultaAgendada) {
        return {
          appointmentDate: appointment.appointmentDate,
          duration: appointment.duration,
          appointmentCode: appointment.code,
          status: AppointmentStatus.scheduled,
        };
      }

      if (!result?.consultaAgendada) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, result.message);
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.createSchedule.name, error);
    }
  }

  extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return this.amigoEntitiesService.extractEntity(integration, entityType, filter, undefined, cache);
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      filter,
      patient,
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      limit,
      periodOfDay,
    } = availableSchedules;

    const schedulerList: {
      appointmentDate: string;
      appointmentCode: string;
      doctorId: string;
      doctorName: string;
    }[] = [];

    const listDoctors = async () => {
      const doctors = await this.amigoApiService.listDoctors(
        integration,
        this.amigoHelpersService.filterBlankParams({
          event_id: filter?.procedure?.code,
          insurance_id: filter?.insurance?.code,
          place_id: filter?.organizationUnit?.code,
          specialty: filter?.speciality?.code,
        }),
      );
      return doctors.map(({ id, name }) => ({ id, name }));
    };

    const doctorsToFilter = filter.doctor
      ? [{ id: filter.doctor?.code, name: filter.doctor?.name }]
      : await listDoctors();
    const promises = doctorsToFilter.map(async (doctor) => {
      const responseDates = await this.amigoApiService.listAvailableSchedulerByDoctor(integration, {
        userId: doctor.id,
        event_id: filter.procedure.code,
      });

      const promises = responseDates.map(async (date) => {
        const response = await this.amigoApiService.listAvailableSchedulerByDoctor(integration, {
          userId: doctor.id,
          event_id: filter.procedure.code,
          insurance_id: filter.insurance?.code,
          place_id: filter.organizationUnit?.code,
          date,
        });

        if (!response.length) {
          return { schedules: [], metadata: null };
        }

        response.forEach((scheduler) =>
          schedulerList.push({
            appointmentDate: moment(scheduler.start_date)
              .set({ h: scheduler.hour.substring(0, 2) })
              .format('YYYY-MM-DD HH:mm:ss')
              .toString(),
            appointmentCode: scheduler.id,
            doctorId: doctor.id,
            doctorName: doctor.name,
          }),
        );
      });

      await Promise.allSettled(promises);
    });
    await Promise.allSettled(promises);

    const doctorsSet = new Set([]);
    schedulerList.forEach((schedulerDate) => doctorsSet.add(schedulerDate.doctorId));

    const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
      integration._id,
      Array.from(doctorsSet),
      EntityType.doctor,
      { canSchedule: true },
    );

    const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
      integrationId: integration._id,
      entities: doctors,
      entitiesFilter: availableSchedules.filter,
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

    const schedules: RawAppointment[] = [];
    const scheduleFiltered = schedulerList
      .filter((schedule) => !!doctorsMap[schedule.doctorId])
      .filter((schedule) => moment(schedule.appointmentDate).isAfter(moment()));

    for await (const scheduler of scheduleFiltered) {
      const schedule: RawAppointment = {
        appointmentTypeId: filter.appointmentType.code,
        insuranceId: filter.insurance?.code,
        insurancePlanId: filter.insurancePlan?.code,
        appointmentCode: scheduler.appointmentCode,
        duration: '-1',
        appointmentDate: scheduler.appointmentDate,
        status: AppointmentStatus.scheduled,
        doctorId: scheduler.doctorId ? String(scheduler.doctorId) : undefined,
        organizationUnitId: filter.organizationUnit?.code ? String(filter.organizationUnit?.code) : undefined,
      };

      if (!doctorsMap?.[scheduler.doctorId]) {
        schedule.doctorDefault = {
          code: String(scheduler.doctorId),
          name: String(scheduler.doctorName),
          friendlyName: String(scheduler.doctorName),
        };
      }

      schedules.push(schedule);
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
        schedules,
      );

    const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
    return { schedules: validSchedules, metadata: { ...partialMetadata } };
  }

  async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.organizationUnit:
      case EntityType.insurance:
      case EntityType.insurancePlan:
      case EntityType.doctor:
      case EntityType.speciality:
      case EntityType.appointmentType:
      case EntityType.procedure:
        return await this.amigoEntitiesService.listValidApiEntities(integration, targetEntity, filters, patient, cache);
      default:
        return [] as EntityDocument[];
    }
  }

  async getMinifiedPatientSchedules(
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
      const data = await this.amigoApiService.listPatientSchedules(integration, {
        patient_id: patientCode,
        start_date: moment().format('YYYY-MM-DD').toString(),
      });

      if (!data?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const dataFiltered = data
        .filter((el) => el.status == ScheduleStatusEnum.scheduled || el.status == ScheduleStatusEnum.confirmed)
        .filter((el) => moment(el.start_date).diff(Date.now()) > 0);

      const schedules: Appointment[] = await Promise.all(
        this.amigoHelpersService
          .createPatientAppointmentObject(integration, dataFiltered)
          .map(async (rawAppointment) => {
            const [schedule] = await this.appointmentService.transformSchedules(integration, [rawAppointment]);

            const flowSteps: FlowSteps[] = [FlowSteps.listPatientSchedules];

            if (patientSchedules.target) {
              flowSteps.push(patientSchedules.target);
            }

            const matchFlows: MatchFlowActions = {
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
              },
            };

            const flowActions = await this.flowService.matchFlowsAndGetActions(matchFlows);

            minifiedSchedules.appointmentList.push({
              appointmentCode: schedule.appointmentCode,
              appointmentDate: schedule.appointmentDate,
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
      throw INTERNAL_ERROR_THROWER(this.getMinifiedPatientSchedules.name, error);
    }
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

    if (patientCache && patientCache.code && cache) {
      return patientCache;
    }

    const patientData = await this.amigoApiService.getPatient(integration, {
      cpf,
    });

    if (!patientData) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    const patient: Patient = this.amigoHelpersService.replaceAmigoPatientToPatient(patientData);
    await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
    return patient;
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;

    try {
      const data = await this.amigoApiService.listPatientSchedules(integration, {
        patient_id: patientCode,
        start_date: moment().format('YYYY-MM-DD').toString(),
      });

      if (!data.length) {
        return [];
      }

      const dataFiltered = data
        .filter((el) => el.status == ScheduleStatusEnum.scheduled || el.status == ScheduleStatusEnum.confirmed)
        .filter((el) => moment(el.start_date).diff(Date.now()) > 0);

      const schedules = await this.appointmentService.transformSchedules(
        integration,
        this.amigoHelpersService.createPatientAppointmentObject(integration, dataFiltered),
      );

      return schedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.getPatientSchedules.name, error);
    }
  }

  async updatePatient(integration: IntegrationDocument, patientCode: string, patient: UpdatePatient): Promise<Patient> {
    try {
      const { bornDate, cellPhone, cpf, ...patientData } = patient.patient;

      const response = await this.amigoApiService.updatePatient(integration, {
        id: Number(patientCode),
        born: moment(bornDate).format('YYYY/MM/DD'),
        cpf_responsible: cpf,
        contact_cellphone: formatPhone(cellPhone, true),
        ...patientData,
      });
      return this.amigoHelpersService.replaceAmigoPatientToPatient(response);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(this.updatePatient.name, error);
    }
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return this.amigoConfirmationService.confirmOrCancelSchedule(
      ConfirmOrCancelConfirmation.canceled,
      integration,
      cancelSchedule,
    );
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return this.amigoConfirmationService.confirmOrCancelSchedule(
      ConfirmOrCancelConfirmation.confirmed,
      integration,
      confirmSchedule,
    );
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction[]> {
    return this.amigoConfirmationService.matchFlowsConfirmation(integration, data);
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirm | ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return this.amigoConfirmationService.listSchedulesToConfirm(integration, data as ListSchedulesToConfirmV2);
  }
}
