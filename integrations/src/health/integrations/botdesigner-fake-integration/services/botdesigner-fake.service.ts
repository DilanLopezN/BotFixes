import { Injectable, HttpStatus } from '@nestjs/common';
import {
  CreateSchedule,
  CreatePatient,
  UpdatePatient,
  CancelSchedule,
  ConfirmSchedule,
  ListPatientSchedulesFilters,
} from 'kissbot-health-core';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  IIntegratorService,
  InitialPatient,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  MatchFlowsConfirmation,
  PatientFilters,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  CreatePatient as InternalCreatePatient,
  CreateSchedule as InternalCreateSchedule,
  Reschedule as InternalReschedule,
  PatientSchedules,
  UpdatePatient as InternalUpdatePatient,
  ConfirmSchedule as InternalConfirmSchedule,
  CancelSchedule as InternalCancelSchedule,
  ListSchedulesToConfirmV2,
  CancelScheduleV2,
  ConfirmScheduleV2,
} from '../../../integrator/interfaces';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { BotdesignerFakeApiService } from './botdesigner-fake-api.service';
import { BotdesignerFakeConfirmationService } from './botdesigner-fake-confirmation.service';
import { BotdesignerFakeEntitiesService } from './botdesigner-fake-entities.service';
import { BotdesignerFakeHelpersService } from './botdesigner-fake-helpers.service';
import { EntityDocument } from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { FlowAction, FlowActionElement } from '../../../flow/interfaces/flow.interface';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { SchedulesService } from '../../../schedules/schedules.service';
import { getFakeOrganizationUnitAddress } from '../utils/fake-data.util';

@Injectable()
export class BotdesignerFakeService implements IIntegratorService {
  private readonly scheduleValues = ['100,00', '150,00', '200,00'];

  constructor(
    private readonly botdesignerFakeEntitiesService: BotdesignerFakeEntitiesService,
    private readonly botdesignerFakeConfirmationService: BotdesignerFakeConfirmationService,
    private readonly botdesignerFakeApiService: BotdesignerFakeApiService,
    private readonly botdesignerFakeHelpersService: BotdesignerFakeHelpersService,
    private readonly appointmentService: AppointmentService,
    private readonly entitiesService: EntitiesService,
    private readonly schedulesService: SchedulesService,
  ) {}

  async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: InternalConfirmSchedule,
  ): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = confirmSchedule;
      const payload: ConfirmSchedule = {
        scheduleCode,
        schedule: {
          patientCode: confirmSchedule.patientCode,
          appointmentTypeCode: confirmSchedule.data?.appointmentTypeCode || null,
        },
      };
      return await this.botdesignerFakeApiService.confirmSchedule(integration, payload);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.confirmSchedule', error);
    }
  }

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: InternalCancelSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode: scheduleCode } = cancelSchedule;
      const payload: CancelSchedule = {
        scheduleCode,
        schedule: {
          patientCode: cancelSchedule.patientCode || cancelSchedule.patient?.code,
          appointmentTypeCode: cancelSchedule.data?.appointmentTypeCode || null,
        },
      };
      return await this.botdesignerFakeApiService.cancelSchedule(integration, payload);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.cancelSchedule', error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: InternalCreateSchedule): Promise<Appointment> {
    try {
      const {
        appointment: { appointmentDate, code: appointmentCode, duration },
        patient,
        doctor,
        insurance,
        organizationUnit,
        speciality,
        appointmentType,
        procedure,
        typeOfService,
      } = createSchedule;

      const response: Appointment = {
        appointmentDate,
        duration,
        appointmentCode,
        status: AppointmentStatus.scheduled,
      };

      const payload: CreateSchedule = {
        data: {
          patientCode: patient.code,
          doctorCode: doctor.code,
          duration: Number(duration),
          scheduleDate: moment(appointmentDate).utc().format('YYYY-MM-DDTHH:mm:ss'),
          scheduleCode: appointmentCode,
          insuranceCode: insurance?.code || '1',
          organizationUnitCode: organizationUnit?.code || '1',
          specialityCode: speciality?.code || '1',
          appointmentTypeCode: appointmentType?.code || 'C',
          procedureCode: procedure?.code || null,
          classificationCode: null,
          insurancePlanCode: insurance?.planCode || null,
          insuranceCategoryCode: insurance?.planCategoryCode || null,
          insuranceSubPlanCode: insurance?.subPlanCode || null,
          typeOfServiceCode: typeOfService?.code || null,
          patientInsuranceNumber: patient.insuranceNumber || null,
          patientHeight: patient.height || null,
          patientWeight: patient.weight || null,
          data: null,
        },
      };

      const result = await this.botdesignerFakeApiService.createSchedule(integration, payload);

      if (result?.scheduleCode) {
        return response;
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.createSchedule', error);
    }
  }

  async createPatient(integration: IntegrationDocument, { patient }: InternalCreatePatient): Promise<Patient> {
    const payload: CreatePatient = {
      data: {
        bornDate: patient.bornDate ? moment(patient.bornDate).utc().format('YYYY-MM-DDTHH:mm:ss') : null,
        email: patient.email || null,
        sex: patient.sex?.toUpperCase(),
        name: patient.name,
        cpf: patient.cpf,
        phone: patient.phone ? formatPhone(convertPhoneNumber(patient.phone)) : null,
        cellPhone: patient.cellPhone ? formatPhone(convertPhoneNumber(patient.cellPhone)) : null,
        motherName: patient.motherName || null,
        skinColor: patient.skinColor || null,
      },
    };

    try {
      const data = await this.botdesignerFakeApiService.createPatient(integration, payload);
      if (data?.patientCode) {
        const createdPatient = await this.getPatient(integration, {
          bornDate: patient.bornDate,
          code: data.patientCode,
        });

        return createdPatient;
      }

      return null;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.createPatient', error);
    }
  }

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ): Promise<EntityTypes[]> {
    return await this.botdesignerFakeEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const { limit, sortMethod = AppointmentSortMethod.default } = availableSchedules;

    const fakeSchedules = await this.botdesignerFakeApiService.getFakeAvailableSchedules(availableSchedules);

    const schedules: RawAppointment[] = fakeSchedules.map((schedule) => ({
      appointmentTypeId: schedule.appointmentTypeCode,
      insuranceId: schedule.insuranceCode,
      appointmentCode: schedule.scheduleCode,
      duration: schedule.duration.toString(),
      appointmentDate: schedule.scheduleDate,
      status: AppointmentStatus.canceled,
      doctorId: schedule.doctorCode,
      organizationUnitId: schedule.organizationUnitCode,
      specialityId: schedule.specialityCode,
      procedureId: schedule.procedureCode,
      typeOfServiceId: null,
      occupationAreaId: null,
      organizationUnitAdress: getFakeOrganizationUnitAddress(schedule.organizationUnitCode),
    }));

    const { appointments } = await this.appointmentService.getAppointments(
      integration,
      {
        limit,
        sortMethod,
        randomize: false,
        period: null,
        periodOfDay: null,
      },
      schedules,
    );

    const validSchedules = await this.appointmentService.transformSchedules(integration, appointments);
    return { schedules: validSchedules, metadata: null };
  }

  async getScheduleValue(): Promise<AppointmentValue> {
    const randomIndex = Math.floor(Math.random() * this.scheduleValues.length);
    const value = this.scheduleValues[randomIndex];

    return {
      currency: 'R$',
      value,
    };
  }

  async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    const allEntities = await this.botdesignerFakeEntitiesService.listApiEntities<EntityDocument>(
      integration,
      targetEntity,
      filters,
      cache,
      patient,
    );

    return allEntities?.filter((entity: EntityDocument) => entity.canView) ?? [];
  }

  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const schedules = await this.getPatientSchedules(integration, patientSchedules);

    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: schedules.map((schedule) => ({
        appointmentCode: schedule.appointmentCode,
        appointmentDate: schedule.appointmentDate,
      })),
      lastAppointment: schedules.find((s) => moment(s.appointmentDate).isBefore(moment())) || null,
      nextAppointment: schedules.find((s) => moment(s.appointmentDate).isAfter(moment())) || null,
    };

    return minifiedSchedules;
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    try {
      const { cpf, code } = filters;

      const botdesignerPatient = await this.botdesignerFakeApiService.getPatient(integration, {
        params: {
          cpf,
          code,
        },
      });

      if (!botdesignerPatient?.code) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return this.botdesignerFakeHelpersService.replaceBotdesignerPatientToPatient(botdesignerPatient);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.getPatient', error);
    }
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;

    try {
      const filters: ListPatientSchedulesFilters = {
        params: {
          code: patientCode,
          startDate: null,
        },
      };

      const data = await this.botdesignerFakeApiService.listPatientSchedules(integration, filters);

      return await this.appointmentService.transformSchedules(
        integration,
        await Promise.all(
          data?.map(
            async (schedule) =>
              await this.botdesignerFakeHelpersService.createPatientAppointmentObject(integration, schedule),
          ),
        ),
        false,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.getPatientSchedules', error);
    }
  }

  async getStatus(): Promise<OkResponse> {
    return { ok: true };
  }

  async reschedule(integration: IntegrationDocument, reschedule: InternalReschedule): Promise<Appointment> {
    try {
      const { scheduleToCancelCode, scheduleToCreate } = reschedule;

      // Primeiro, cancela o agendamento antigo diretamente no banco usando apenas o código
      await this.botdesignerFakeApiService.deleteScheduledAppointment(integration, scheduleToCancelCode);

      // Depois, cria o novo agendamento
      const newAppointment = await this.createSchedule(integration, scheduleToCreate);

      return newAppointment;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.reschedule', error);
    }
  }

  async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: InternalUpdatePatient,
  ): Promise<Patient> {
    const payload: UpdatePatient = {
      data: {
        code: patientCode,
        email: patient.email || null,
        phone: patient.phone ? formatPhone(convertPhoneNumber(patient.phone)) : null,
        cellPhone: patient.cellPhone ? formatPhone(convertPhoneNumber(patient.cellPhone)) : null,
      },
    };

    try {
      const data = await this.botdesignerFakeApiService.updatePatient(integration, payload);
      if (data?.patientCode) {
        return await this.getPatient(integration, {
          bornDate: patient.bornDate,
          code: data.patientCode,
        });
      }

      return null;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.updatePatient', error);
    }
  }

  async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.botdesignerFakeConfirmationService.matchFlowsConfirmation(integration, data);
  }

  async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.botdesignerFakeConfirmationService.getScheduleGuidance(integration, data);
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.botdesignerFakeConfirmationService.listSchedulesToConfirm(integration, data);
  }

  async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.botdesignerFakeConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.botdesignerFakeConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  async validateScheduleData(): Promise<OkResponse> {
    return await this.botdesignerFakeConfirmationService.validateScheduleData();
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerFakeService.getConfirmationScheduleById', error);
    }
  }
}
