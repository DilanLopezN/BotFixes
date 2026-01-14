import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { pick } from 'lodash';
import * as moment from 'moment';
import {
  CancelSchedule,
  ConfirmSchedule,
  CreatePatient,
  CreateSchedule,
  GetScheduleValue,
  IIntegratorService,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
  PatientFilters,
  PatientSchedules,
  Reschedule,
  UpdatePatient,
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
import { EntityDocument } from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { PATIENT_CACHE_EXPIRATION } from '../../../integration-cache-utils/cache-expirations';
import { KonsistApiService } from './konsist-api.service';
import { KonsistEntitiesService } from './konsist-entities.service';
import { KonsistHelpersService } from './konsist-helpers.service';
import {
  KonsistAgendaHorarioRequest,
  KonsistPreAgendamentoRequest,
  KonsistPeriodoAgendamentoRequest,
  KonsistIncluirPacienteRequest,
} from '../interfaces';

@Injectable()
export class KonsistService implements IIntegratorService {
  private readonly logger = new Logger(KonsistService.name);

  constructor(
    private readonly konsistApiService: KonsistApiService,
    private readonly konsistEntitiesService: KonsistEntitiesService,
    private readonly konsistHelpersService: KonsistHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  // ==================== STATUS ====================

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const insurances = await this.konsistApiService.listInsurances(integration);

      return { ok: !!insurances?.length };
    } catch (error) {
      return { ok: false };
    }
  }

  // ==================== PATIENT METHODS ====================

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, bornDate, cache } = filters;

    try {
      // Tenta buscar do cache primeiro
      if (cache) {
        const cachedPatient = await this.integrationCacheUtilsService.getPatientFromCache(
          integration,
          code,
          cpf,
          bornDate,
        );
        if (cachedPatient) {
          return cachedPatient;
        }
      }

      // Busca na API
      const patients = await this.konsistApiService.listPatients(integration, { cpf });

      if (!patients?.length) {
        return null;
      }

      const patientData = patients[0];
      const patient: Patient = {
        code: String(patientData.idpaciente),
        name: patientData.nomeregistro || patientData.nomesocial,
        cpf: cpf,
        bornDate: patientData.nascimento,
        sex: patientData.sexo,
        email: '',
        phone: '',
        cellPhone: '',
      };

      // Salva no cache
      if (cache && patient) {
        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          patient.code,
          cpf,
          patient,
          PATIENT_CACHE_EXPIRATION.toString(),
        );
      }

      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getPatient', error);
    }
  }

  async createPatient(integration: IntegrationDocument, createPatient: CreatePatient): Promise<Patient> {
    try {
      const { patient } = createPatient;

      const payload: KonsistIncluirPacienteRequest = {
        nome: patient.name,
        cpf: patient.cpf,
        datanascimento: this.konsistHelpersService.formatDateForKonsist(patient.bornDate),
        sexo: patient.sex || 'M',
        idconvenio: 0,
        email: patient.email,
        telefone: this.konsistHelpersService.formatPhoneForKonsist(patient.cellPhone || patient.phone),
      };

      const response = await this.konsistApiService.createPatient(integration, payload);

      if (!response?.idpaciente) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Failed to create patient', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      return {
        code: String(response.idpaciente),
        name: patient.name,
        cpf: patient.cpf,
        bornDate: patient.bornDate,
        sex: patient.sex,
        email: patient.email,
        phone: patient.phone,
        cellPhone: patient.cellPhone,
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.createPatient', error);
    }
  }

  async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    updatePatient: UpdatePatient,
  ): Promise<Patient> {
    // Konsist não tem endpoint de atualização de paciente
    // Retorna o paciente existente
    const patient = await this.getPatient(integration, { code: patientCode, cache: false });
    return patient;
  }

  // ==================== SCHEDULE METHODS ====================

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      filter,
      limit,
      periodOfDay,
      patient,
    } = availableSchedules;

    try {
      const schedules: RawAppointment[] = [];

      // Monta request para buscar horários disponíveis
      const request: KonsistAgendaHorarioRequest = {
        idmedico: Number(filter.doctor?.code),
        idconvenio: Number(filter.insurance?.code),
        codigoprocedimento: filter.procedure?.code || '',
        datainicio: period?.start ? String(period.start) : moment().format('YYYY-MM-DD'),
        datafim: period?.end ? String(period.end) : moment().add(30, 'days').format('YYYY-MM-DD'),
        idlocal: filter.organizationUnit?.code ? Number(filter.organizationUnit.code) : undefined,
        idespecialidade: filter.speciality?.code ? Number(filter.speciality.code) : undefined,
        datanascimentopaciente: patient?.bornDate
          ? this.konsistHelpersService.formatDateForKonsist(patient.bornDate)
          : undefined,
      };

      const availableSlots = await this.konsistApiService.getAvailableSchedules(integration, request);

      if (availableSlots?.length) {
        for (const slot of availableSlots) {
          const rawAppointment = this.konsistHelpersService.transformAvailableSlot(slot, filter);
          schedules.push(rawAppointment);
        }
      }

      // Processa e randomiza os agendamentos
      const { appointments: processedAppointments, metadata } = await this.appointmentService.getAppointments(
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

      // Transforma em Appointment com entidades
      const validSchedules = await this.appointmentService.transformSchedules(integration, processedAppointments);

      return { schedules: validSchedules, metadata };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getAvailableSchedules', error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, patient, doctor, insurance, procedure } = createSchedule;

      // Monta payload para pré-agendamento
      const payload: KonsistPreAgendamentoRequest = {
        origem: 1, // 1 = Parceiros
        chave: Number(appointment.code) || Number(appointment.data?.chave),
        idpaciente: Number(patient.code),
        idmedico: Number(doctor?.code),
        idconvenio: Number(insurance?.code),
        idservico: Number(procedure?.code),
        codigoprocedimento: procedure?.code || '',
        descricaoprocedimento: procedure?.specialityType || '',
        observacao: 'Agendamento via Bot',
      };

      const response = await this.konsistApiService.createPreAgendamento(integration, payload);

      if (!response?.protocolo) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'Failed to create schedule',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return {
        appointmentCode: response.protocolo,
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration || '30',
        status: AppointmentStatus.scheduled,
        data: {
          protocolo: response.protocolo,
          chave: payload.chave,
        },
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.createSchedule', error);
    }
  }

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode } = cancelSchedule;

    try {
      const response = await this.konsistApiService.updateAppointmentStatus(integration, {
        chave: Number(appointmentCode),
        status: 2, // 2 = Desmarcado
      });

      if (response?.statusalterado) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.cancelSchedule', error);
    }
  }

  async confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { appointmentCode } = confirmSchedule;

    try {
      const response = await this.konsistApiService.updateAppointmentStatus(integration, {
        chave: Number(appointmentCode),
        status: 1, // 1 = Confirmado
      });

      if (response?.statusalterado) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.confirmSchedule', error);
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate } = reschedule;

    //fazer completo ou dar return null
    try {
      // Cancela agendamento anterior
      await this.cancelSchedule(integration, {
        appointmentCode: scheduleToCancelCode,
        patientCode: reschedule.patient?.code,
      });

      // Cria novo agendamento
      return await this.createSchedule(integration, scheduleToCreate);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.reschedule', error);
    }
  }

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, patientCpf, startDate, endDate, target } = patientSchedules;

    try {
      const request: KonsistPeriodoAgendamentoRequest = {
        datai: startDate ? String(startDate) : moment().format('YYYY-MM-DD'),
        dataf: endDate ? String(endDate) : moment().add(90, 'days').format('YYYY-MM-DD'),
        cpfPaciente: patientCpf,
        idpaciente: patientCode ? Number(patientCode) : undefined,
      };

      const response = await this.konsistApiService.getAppointmentsByPeriod(integration, request);

      if (!response?.length) {
        return [];
      }

      const rawAppointments: RawAppointment[] = [];

      for (const patientData of response) {
        if (patientData.agendamento?.length) {
          for (const agendamento of patientData.agendamento) {
            const rawAppointment = this.konsistHelpersService.transformAppointment(agendamento, patientData);
            rawAppointments.push(rawAppointment);
          }
        }
      }

      // Transforma em Appointments
      const appointments = await this.appointmentService.transformSchedules(integration, rawAppointments);

      // Adiciona flow actions se necessário
      const flowSteps = [FlowSteps.listPatientSchedules];
      if (target) {
        flowSteps.push(target);
      }

      for (const schedule of appointments) {
        const flowActions = await this.flowService.matchFlowsAndGetActions({
          integrationId: integration._id,
          targetFlowTypes: flowSteps,
          entitiesFilter: {
            ...pick(schedule, [
              EntityType.appointmentType,
              EntityType.doctor,
              EntityType.procedure,
              EntityType.insurance,
              EntityType.insurancePlan,
              EntityType.organizationUnit,
              EntityType.speciality,
            ]),
          },
        });

        schedule.actions = flowActions;
      }

      return appointments;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getPatientSchedules', error);
    }
  }

  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const schedules = await this.getPatientSchedules(integration, patientSchedules);

    const minifiedSchedules: MinifiedAppointments = {
      lastAppointment: null,
      nextAppointment: null,
      appointmentList: schedules.map((s) => ({
        appointmentCode: s.appointmentCode,
        appointmentDate: s.appointmentDate,
        appointmentType: s.appointmentType?.code,
        actions: s.actions,
      })),
    };

    const now = moment();
    const pastSchedules = schedules.filter((s) => moment(s.appointmentDate).isBefore(now));
    const futureSchedules = schedules.filter((s) => moment(s.appointmentDate).isAfter(now));

    if (pastSchedules.length) {
      minifiedSchedules.lastAppointment = pastSchedules[pastSchedules.length - 1];
    }

    if (futureSchedules.length) {
      minifiedSchedules.nextAppointment = futureSchedules[0];
    }

    return minifiedSchedules;
  }

  getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'KonsistService.getScheduleValue: Not implemented');
  }

  // ==================== ENTITY METHODS ====================

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilter?: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    return this.konsistEntitiesService.extractEntity({
      integration,
      targetEntity: entityType,
      filters: rawFilter,
      cache,
    });
  }

  async getEntityList(
    integration: IntegrationDocument,
    filters: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    return this.konsistEntitiesService.listValidApiEntities({
      integration,
      targetEntity,
      filters,
      cache,
    });
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }
}
