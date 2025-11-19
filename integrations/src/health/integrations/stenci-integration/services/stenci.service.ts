import { Injectable, NotImplementedException } from '@nestjs/common';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  Appointment,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { CancelSchedule, CancelScheduleV2 } from '../../../integrator/interfaces/cancel-schedule.interface';
import { ConfirmSchedule, ConfirmScheduleV2 } from '../../../integrator/interfaces/confirm-schedule.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import {
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  GetScheduleValue,
  Reschedule,
  IIntegratorService,
  InitialPatient,
  ListSchedulesToConfirmV2,
  ListSchedulesToConfirm,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { StenciApiService } from './stenci-api.service';
import { StenciHelpersService } from './stenci-helpers.service';
import { StenciEntitiesService } from './stenci-entities.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { AppointmentService } from '../../../shared/appointment.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import * as moment from 'moment';
import { FlowAction } from 'kissbot-core';
import { StenciConfirmationService } from './stenci-confirmation.service';
import {
  StenciAppointment,
  StenciAppointmentStatus,
  StenciCreateAppointmentRequest,
  StenciFreeHoursParams,
  StenciListPatientsParams,
} from '../interfaces';
import { RawAppointment } from '../../../shared/appointment.service';
import { formatPhone } from '../../../../common/helpers/format-phone';
@Injectable()
export class StenciService implements IIntegratorService {
  constructor(
    private readonly apiService: StenciApiService,
    private readonly confirmationService: StenciConfirmationService,
    private readonly helpersService: StenciHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly stenciEntitiesService: StenciEntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}
  /**
   * Cria um novo agendamento no Stenci
   */
  public async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, patient, doctor, insurance, procedure, organizationUnit } = createSchedule;
      const appointmentDateStr = appointment.appointmentDate;

      // Prepara os dados do paciente
      const patientData = {
        name: patient.name || '',
        birthDate: this.helpersService.formatDateForStenci(patient.bornDate || ''),
        gender: (patient.sex === 'M' ? 'male' : 'female') as 'male' | 'female',
        identity: {
          type: 'cpf' as const,
          value: patient.cpf || '',
        },
        cellphone: this.helpersService.formatPhoneForStenci(formatPhone(patient.cellPhone || '', false)),
        email: patient.email,
      };

      const patientExists = await this.apiService.getPatientByIdOrIdentity(
        integration,
        patient.cpf,
        organizationUnit?.code,
      );
      if (!patientExists.length) {
        await this.apiService.createPatient(
          integration,
          {
            name: patient.name,
            birthDate: this.helpersService.formatDateForStenci(patient.bornDate || ''),
            gender: (patient.sex === 'M' ? 'male' : 'female') as 'male' | 'female',
            identity: {
              type: 'cpf' as const,
              value: patient.cpf || '',
            },
          },
          organizationUnit.code,
        );
      }

      // Cria o agendamento
      const appointmentPayload: StenciCreateAppointmentRequest = {
        scheduleId: appointment.data?.scheduleId,
        professionalId: doctor?.code || appointment.data?.professionalId,
        date: this.helpersService.formatDateForStenci(appointmentDateStr),
        hour: this.helpersService.formatTimeForStenci(appointmentDateStr),
        patient: patientData,
        insurancePlanId: insurance.planCode,
        serviceId: procedure?.code,
        origin: 'integration',
      };

      // Adiciona notes se houver
      if (appointment.data?.notes) {
        appointmentPayload.notes = appointment.data.notes;
      }

      const response = await this.apiService.createAppointment(integration, appointmentPayload, organizationUnit?.code);

      // Extrai o agendamento criado da resposta e converte para o formato interno
      const createdAppointment: StenciAppointment | undefined = response?.[0]?.data?.items?.[0];
      if (!createdAppointment) {
        throw new Error('Invalid response when creating appointment');
      }

      const raw: RawAppointment = this.convertStenciAppointmentToInternal(createdAppointment);
      const [transformed] = await this.appointmentService.transformSchedules(integration, [raw]);
      return transformed;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.createSchedule', error);
    }
  }

  /**
   * Cancela um agendamento no Stenci
   */
  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode } = cancelSchedule;

    try {
      await this.apiService.updateAppointment(integration, appointmentCode, {
        status: StenciAppointmentStatus.canceled,
      });
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.cancelSchedule', error);
    }
  }

  /**
   * Confirma um agendamento no Stenci
   */
  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    const { appointmentCode } = confirmSchedule;

    try {
      await this.apiService.updateAppointment(integration, appointmentCode, {
        status: StenciAppointmentStatus.confirmed,
      });
      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.confirmSchedule', error);
    }
  }

  /**
   * Busca agendamentos do paciente no Stenci
   */
  public async patientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    try {
      const { patientCode } = patientSchedules;

      // Busca os agendamentos do paciente no período
      const appointments = await this.apiService.listAppointments(integration, {
        patientId: patientCode,
        startDate: moment.parseZone().format('YYYY-MM-DD'),
        endDate: moment.parseZone().add(60, 'days').format('YYYY-MM-DD'),
        limit: 100,
        // status: `${StenciAppointmentStatus.scheduled}, ${StenciAppointmentStatus.confirmed}`
      });

      // Converte os agendamentos para o formato RawAppointment
      const rawAppointments = appointments
        .filter((appointment) => appointment?.data?.items?.length)
        .flatMap((appointment) => appointment.data.items)
        .filter(
          (appointment) =>
            appointment.status === StenciAppointmentStatus.scheduled ||
            appointment.status === StenciAppointmentStatus.confirmed,
        )
        .map((appointment) => ({
          appointmentCode: String(appointment.id),
          appointmentDate: appointment.startDate,
          status: AppointmentStatus[appointment.status] || AppointmentStatus.scheduled,
          duration: String(moment.parseZone(appointment.endDate).diff(appointment.startDate, 'minutes')),
          doctorId: String(appointment.professional?.id),
          organizationUnitId: String(appointment.schedule?.id),
          procedureId: String(appointment.services?.[0]?.id),
          specialityId: null,
          insuranceId: String(appointment.insurance?.plan?.id),
          appointmentTypeId: ScheduleType.Consultation,
        }));

      // Transforma usando o appointmentService
      const schedules = await this.appointmentService.transformSchedules(integration, rawAppointments);
      return schedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.patientSchedules', error);
    }
  }

  /**
   * Lista horários disponíveis no Stenci (IIntegratorService)
   */
  public async getAvailableSchedules(
    integration: IntegrationDocument,
    listAvailableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const { fromDay, untilDay, filter, periodOfDay, limit, period, sortMethod, randomize } = listAvailableSchedules;

      const startDate = moment.parseZone().add(fromDay, 'days');
      const endDate = moment.parseZone().add(untilDay, 'days');

      // Prepara os parâmetros da busca
      const params: StenciFreeHoursParams = {
        limit: 20,
        offset: 0,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };

      if (filter.insurancePlan?.code) params.insurancePlanId = filter.insurancePlan.code;
      if (filter.procedure?.code) params.serviceId = filter.procedure.code;
      if (filter.doctor?.code) params.professionalIds = filter.doctor.code;

      const validDoctors: EntityDocument[] = await this.stenciEntitiesService.listValidApiEntities({
        integration,
        targetEntity: EntityType.doctor,
        filters: {
          organizationUnit: filter.organizationUnit,
          speciality: filter.speciality,
          insurancePlan: filter.insurancePlan,
        },
        cache: true,
      });
      const activeDoctorIds = new Set((validDoctors || []).map((d) => String(d.code)));

      const freeHours = await this.apiService.getFreeHours(integration, params, filter.organizationUnit?.code);

      const filteredFreeHours = (freeHours?.[0] || []).filter((fh) => activeDoctorIds.has(String(fh.professional?.id)));

      const rawAppointments = [];

      for (const freeHour of filteredFreeHours) {
        for (const hour of freeHour.hours) {
          const dateTimeString = `${freeHour.date}T${hour}:00`;
          const dateTime = moment.parseZone(dateTimeString);

          if (periodOfDay) {
            const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
              periodOfDay,
              limit,
              sortMethod,
              randomize,
              period,
            });

            const hourOnly = dateTime.format('HH:mm');
            if (hourOnly < start || hourOnly > end) {
              continue;
            }
          }

          rawAppointments.push({
            appointmentCode: `${freeHour.schedule.id}_${dateTime.format('YYYY-MM-DD_HH:mm')}`,
            appointmentDate: dateTime.parseZone().format(),
            status: AppointmentStatus.scheduled,
            doctorId: freeHour.professional.id,
            insuranceId: filter.insurance?.code,
            procedureId: filter.procedure?.code,
            specialityId: filter.speciality?.code,
            data: {
              scheduleId: freeHour.schedule.id,
              professionalId: freeHour.professional.id,
              professionalName: freeHour.professional.name,
            },
            doctorDefault: {
              code: freeHour.professional.id,
              name: freeHour.professional.name,
              friendlyName: freeHour.professional.name,
              canSchedule: true,
              canReschedule: true,
              canCancel: true,
              canConfirmActive: true,
              canConfirmPassive: true,
              canView: true,
            },
          });
        }
      }

      const { appointments, metadata } = await this.appointmentService.getAppointments(
        integration,
        {
          limit: listAvailableSchedules.limit,
          period: listAvailableSchedules.period,
          randomize: listAvailableSchedules.randomize,
          sortMethod: listAvailableSchedules.sortMethod,
          periodOfDay: listAvailableSchedules.periodOfDay,
        },
        rawAppointments,
      );

      const validSchedules = await this.appointmentService.transformSchedules(integration, appointments);

      return {
        schedules: validSchedules,
        metadata: metadata,
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.getAvailableSchedules', error);
    }
  }

  /**
   * Cria um novo paciente no Stenci
   */
  public async createPatient(integration: IntegrationDocument, createPatient: CreatePatient): Promise<Patient> {
    try {
      const { patient, organizationUnit } = createPatient;
      const response = await this.apiService.createPatient(
        integration,
        {
          name: patient.name,
          birthDate: this.helpersService.formatDateForStenci(patient.bornDate),
          gender: (patient.sex === 'M' ? 'male' : 'female') as 'male' | 'female',
          identity: {
            type: 'cpf',
            value: patient.cpf,
          },
          cellphone: this.helpersService.formatPhoneForStenci(formatPhone(patient.cellPhone || '', true)),
          email: patient.email,
        },
        organizationUnit.code,
      );

      return this.helpersService.replaceStenciPatientToPatient(response[0] || null);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.createPatient', error);
    }
  }

  reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    throw new Error('Method not implemented.');
  }

  /**
   * Atualiza um paciente no Stenci
   */
  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    updatePatient: UpdatePatient,
  ): Promise<Patient> {
    try {
      const { patient } = updatePatient;
      const response = await this.apiService.updatePatient(integration, patientCode, {
        name: patient.name,
        cellphone: this.helpersService.formatPhoneForStenci(formatPhone(patient.cellPhone || '', true)),
        email: patient.email,
      });

      return this.helpersService.replaceStenciPatientToPatient(response[0] || null);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.updatePatient', error);
    }
  }

  /**
   * Busca um paciente no Stenci por CPF
   */
  public async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<Patient | null> {
    try {
      const response = await this.apiService.getPatientByIdOrIdentity(integration, cpf);
      const patientData = response.filter((patient) => !!patient);
      if (!patientData?.length) return null;
      return this.helpersService.replaceStenciPatientToPatient(patientData[0]);
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca pacientes no Stenci
   */
  public async listPatients(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient[]> {
    try {
      const params: StenciListPatientsParams = {
        limit: 50,
      };

      if (filters.name) {
        params.search = filters.name;
      }

      if (filters.cpf) {
        params.identity = filters.cpf;
      }

      const response = await this.apiService.listPatients(integration, params);
      const dataMap = new Map();
      response.flat().forEach((el) => el.items?.forEach((item) => dataMap.set(item.id, item)));
      const data = Array.from(dataMap.values());

      return data.map((p) => this.helpersService.replaceStenciPatientToPatient(p));
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.listPatients', error);
    }
  }

  /**
   * Converte um agendamento do Stenci para o formato interno
   */
  private convertStenciAppointmentToInternal(stenciAppointment: StenciAppointment): RawAppointment {
    return {
      appointmentCode: String(stenciAppointment.id),
      appointmentDate: stenciAppointment.startDate,
      status: this.helpersService.convertStenciStatus(String(stenciAppointment.status)),
      // Ignora timezone ao calcular a duração, mantendo o relógio local
      duration: String(
        moment.parseZone(stenciAppointment.endDate).diff(moment.parseZone(stenciAppointment.startDate), 'minutes'),
      ),
      doctorId: String(stenciAppointment.professional?.id),
      organizationUnitId: String(stenciAppointment.schedule?.id),
      procedureId: String(stenciAppointment.services?.[0]?.id),
      insuranceId: String(stenciAppointment.insurance?.plan?.id),
      appointmentTypeId: ScheduleType.Consultation,
      data: {
        scheduleId: stenciAppointment.schedule?.id,
        scheduleName: stenciAppointment.schedule?.name,
        notes: stenciAppointment.notes,
      },
    };
  }

  // ==================== IIntegratorService Required Methods ====================

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilter?: CorrelationFilter,
    cache?: boolean,
    fromImport?: boolean,
  ): Promise<EntityTypes[]> {
    try {
      return await this.stenciEntitiesService.extractEntity({
        integration,
        targetEntity: entityType,
        filters: rawFilter || {},
        cache,
        fromImport,
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.extractSingleEntity', error);
    }
  }

  public async getScheduleValue(
    _integration: IntegrationDocument,
    _scheduleValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    return {
      value: 'Consulte a clínica',
      currency: 'R$',
    };
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    try {
      return await this.stenciEntitiesService.listValidApiEntities({
        integration,
        targetEntity,
        filters: rawFilter,
        cache,
        patient,
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.getEntityList', error);
    }
  }

  public async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    const { patientCode } = patientSchedules;

    try {
      const appointments = await this.patientSchedules(integration, patientSchedules);

      if (!appointments || !appointments.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });
        return minifiedSchedules;
      }

      const now = moment.parseZone();
      const futureAppointments = appointments.filter((apt) =>
        moment.parseZone(apt.appointmentDate).isSameOrAfter(now, 'day'),
      );
      const sortedAppointments = futureAppointments.sort(
        (a, b) => moment.parseZone(a.appointmentDate).valueOf() - moment.parseZone(b.appointmentDate).valueOf(),
      );

      minifiedSchedules.appointmentList = sortedAppointments.map((apt) => ({
        appointmentDate: apt.appointmentDate,
        appointmentCode: apt.appointmentCode,
        appointmentType: apt.procedure?.name || apt.appointmentType?.name || 'Consulta',
        actions: [],
      }));

      minifiedSchedules.nextAppointment =
        sortedAppointments.find((apt) => moment.parseZone(apt.appointmentDate).isAfter(now)) || null;

      const pastAppointments = appointments
        .filter((apt) => moment.parseZone(apt.appointmentDate).isBefore(now, 'day'))
        .sort((a, b) => moment.parseZone(b.appointmentDate).valueOf() - moment.parseZone(a.appointmentDate).valueOf());

      minifiedSchedules.lastAppointment = pastAppointments[0] || null;

      await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
        minifiedSchedules,
        schedules: appointments,
      });

      return minifiedSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('StenciService.getMinifiedPatientSchedules', error);
    }
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    if (filters.cpf) {
      const patient = await this.getPatientByCpf(integration, filters.cpf);
      if (patient) {
        return patient;
      }
    }

    if (filters.code) {
      const patients = await this.listPatients(integration, { code: filters.code });
      if (patients?.length) {
        return patients[0];
      }
    }

    return null;
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    return await this.patientSchedules(integration, patientSchedules);
  }

  public async getStatus(_integration: IntegrationDocument): Promise<OkResponse> {
    return { ok: true };
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return this.confirmationService.confirmOrCancelSchedule(
      StenciAppointmentStatus.confirmed,
      integration,
      cancelSchedule,
    );
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return this.confirmationService.confirmOrCancelSchedule(
      StenciAppointmentStatus.canceled,
      integration,
      confirmSchedule,
    );
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction[]> {
    return this.confirmationService.matchFlowsConfirmation(integration, data);
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirm | ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return this.confirmationService.listSchedulesToConfirm(integration, data as ListSchedulesToConfirmV2);
  }
}
