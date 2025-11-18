import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CancelSchedule,
  CancelScheduleV2,
  ConfirmScheduleV2,
  CreatePatient,
  CreateSchedule,
  IIntegratorService,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  PatientFilters,
  PatientSchedules,
  Reschedule,
} from '../../../integrator/interfaces';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { DoctorEntityDocument, EntityDocument } from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { DrMobileApiService } from './dr-mobile-api.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { DrMobileEntitiesService } from './dr-mobile-entities.service';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import {
  DrMobileAvailableSchedules,
  DrMobileCancelScheduleResponse,
  DrMobileCreateSchedule,
  DrMobileCreatePatient,
  DrMobilePatientSchedulesResponse,
} from '../interfaces';
import * as moment from 'moment';
import { DrMobileHelpersService } from './dr-mobile-helpers.service';
import { orderBy } from 'lodash';
import { MatchFlowActions } from '../../../flow/interfaces/match-flow-actions';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { DrMobileConfirmationService } from './dr-mobile-confirmation.service';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';

@Injectable()
export class DrMobileService implements IIntegratorService {
  constructor(
    private readonly drMobileApiService: DrMobileApiService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly drMobileEntitiesService: DrMobileEntitiesService,
    private readonly drMobileHelpersService: DrMobileHelpersService,
    private readonly drMobileConfirmationService: DrMobileConfirmationService,
  ) {}

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode, patientCode } = cancelSchedule;

    try {
      const response: DrMobileCancelScheduleResponse = await this.drMobileApiService.cancelSchedule(integration, {
        patientCode,
        scheduleCode: appointmentCode,
      });

      if (response?.retorno?.includes('Agendamento cancelado com sucesso')) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileService.cancelSchedule', error);
    }
  }

  confirmSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'DrMobileService.confirmSchedule: Not implemented');
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, organizationUnit, insurance, patient } = createSchedule;

      const response: Appointment = {
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        appointmentCode: appointment.code,
        status: AppointmentStatus.scheduled,
      };

      const phone = patient.phone || patient.cellPhone;
      const formattedPhone = phone?.startsWith('55') ? phone : `55${phone}`;

      const payload: DrMobileCreateSchedule = {
        celular: formattedPhone,
        codigopaciente: Number(patient.code),
        convenio: insurance.code,
        cpf: patient.cpf,
        hospital: '01277573000120',
        identity: patient.code,
        nascimento: moment(patient.bornDate).format('DD/MM/YYYY'),
        opcaohorario: appointment.code,
        sexo: patient.sex,
      };

      if (insurance.planCode) {
        payload.plano = insurance.planCode;
      }

      if (organizationUnit?.code) {
        payload.empresa = organizationUnit.code;
      }

      const result = await this.drMobileApiService.createSchedule(integration, payload);

      if (result?.sucess === 1) {
        return response;
      }

      if (result?.sucess === 0) {
        if (result.mensagem?.includes('alto fluxo de agendamentos')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
        }

        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, result.mensagem);
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobile.createSchedule', error);
    }
  }

  async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    const payload: DrMobileCreatePatient = {
      nrCpf: patient.cpf,
      nascimento: moment(patient.bornDate).toISOString(),
      nome: patient.name,
      tpsexo: String(patient.sex).toUpperCase(),
    };

    try {
      await this.drMobileApiService.createPatient(integration, payload);
      const createdPatient = await this.getPatient(integration, {
        bornDate: patient.bornDate,
        cpf: patient.cpf,
      });

      return createdPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileService.createPatient', error);
    }
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
    fromImport?: boolean,
  ): Promise<EntityTypes[]> {
    return await this.drMobileEntitiesService.extractEntity(integration, entityType, filter, cache, fromImport);
  }

  private async createListAvailableSchedulesObject(
    _: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<DrMobileAvailableSchedules> {
    const {
      filter: { insurance, organizationUnit, speciality, doctor, procedure },
      patient,
    } = availableSchedules;

    const payload: DrMobileAvailableSchedules = {
      hospital: '01277573000120',
      convenio: Number(insurance.code),
      cpf: patient.cpf,
      idade: moment().diff(patient.bornDate, 'years'),
      sexo: patient.sex,
      unidade: Number(organizationUnit.code),
      identity: Number(patient.code),
      servico: Number(speciality.code),
    };

    if (doctor?.code) {
      payload.prestador = Number(doctor.code);
    }

    if (procedure?.code) {
      const procedureData = this.drMobileHelpersService.getCompositeProcedureCode(procedure?.code);
      payload.item = Number(procedureData.code);
    }

    return payload;
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const payload = await this.createListAvailableSchedulesObject(integration, availableSchedules);
    const {
      filter,
      patient,
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      limit,
      periodOfDay,
    } = availableSchedules;

    const results = await this.drMobileApiService.listAvailableSchedules(integration, payload);

    if (!results?.length) {
      return { schedules: [], metadata: null };
    }

    const doctorsSet = new Set([]);
    results.forEach((drMobileSchedule) => doctorsSet.add(drMobileSchedule.medico));

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

    for await (const drMobileSchedule of results) {
      const schedule: RawAppointment = {
        appointmentTypeId: filter.appointmentType.code,
        insuranceId: filter.insurance.code,
        appointmentCode: String(drMobileSchedule.opcao),
        duration: '-1',
        appointmentDate: this.drMobileHelpersService.convertDate(drMobileSchedule.horario),
        status: AppointmentStatus.scheduled,
        doctorId: String(drMobileSchedule.medico),
        organizationUnitId: String(filter.organizationUnit.code),
      };

      if (!doctorsMap?.[drMobileSchedule.medico]) {
        schedule.doctorDefault = {
          code: String(drMobileSchedule.medico),
          name: String(drMobileSchedule.nmmedico),
          friendlyName: String(drMobileSchedule.nmmedico),
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

  getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'DrMobileService.getScheduleValue: Not implemented');
  }

  async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.speciality:
      case EntityType.organizationUnit:
      case EntityType.insurance:
      case EntityType.insurancePlan:
      case EntityType.typeOfService:
      case EntityType.appointmentType:
      case EntityType.procedure:
      case EntityType.doctor:
        return await this.drMobileEntitiesService.listValidApiEntities(integration, targetEntity, filters, cache);

      case EntityType.organizationUnitLocation:
      case EntityType.occupationArea:
        return await this.entitiesService.getValidEntities(targetEntity, integration._id);

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
      const data: DrMobilePatientSchedulesResponse = await this.drMobileApiService.listPatientSchedules(integration, {
        codigoPaciente: Number(patientCode),
      });

      if (!data?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        data.map(async (drMobileSchedule) => {
          const [schedule] = await this.appointmentService.transformSchedules(integration, [
            await this.drMobileHelpersService.createPatientAppointmentObject(integration, drMobileSchedule),
          ]);

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
              occupationArea: schedule.occupationArea,
              organizationUnitLocation: schedule.organizationUnitLocation,
              typeOfService: schedule.typeOfService,
            },
          };

          const flowActions = await this.flowService.matchFlowsAndGetActions(matchFlows);

          minifiedSchedules.appointmentList.push({
            appointmentCode: String(drMobileSchedule.cd_it_agenda_central),
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
      throw INTERNAL_ERROR_THROWER('DrMobileService.getMinifiedPatientSchedules', error);
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

    if (patientCache && cache) {
      return patientCache;
    }

    const drMobilePatient = await this.drMobileApiService.getPatient(integration, {
      cpf,
    });

    if (!drMobilePatient) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    const patient = this.drMobileHelpersService.replaceDrMobilePatientToPatient(drMobilePatient);
    await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
    return patient;
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;

    try {
      const data: DrMobilePatientSchedulesResponse = await this.drMobileApiService.listPatientSchedules(integration, {
        codigoPaciente: Number(patientCode),
      });

      if (!data.length) {
        return [];
      }

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          data.map(
            async (schedule) => await this.drMobileHelpersService.createPatientAppointmentObject(integration, schedule),
          ),
        ),
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileService.getPatientSchedules', error);
    }
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const entities = await this.drMobileApiService.listSpecialities(integration, true);

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
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode === scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('DrMobileService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      const createdSchedule = await this.createSchedule(integration, scheduleToCreate);

      if (!createdSchedule?.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'DrMobileService.reschedule: error creating new schedule',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const { appointmentCode } = appointmentToCancel;

      const cancelSchedulePayload = {
        appointmentCode,
        patientCode: patient.code,
      };
      const canceledOldAppointment = await this.cancelSchedule(integration, cancelSchedulePayload);

      if (!canceledOldAppointment.ok) {
        const { appointmentCode } = createdSchedule;

        await this.cancelSchedule(integration, {
          appointmentCode,
          patientCode: patient.code,
        });

        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'Error on cancel old appointment',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return createdSchedule;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  updatePatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'DrMobileService.updatePatient: Not implemented');
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.drMobileConfirmationService.matchFlowsConfirmation(integration, data);
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.drMobileConfirmationService.listSchedulesToConfirm(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.drMobileConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.drMobileConfirmationService.confirmSchedule(integration, confirmSchedule);
  }
}
