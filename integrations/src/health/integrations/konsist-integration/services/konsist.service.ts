import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { pick } from 'lodash';
import * as moment from 'moment';
import {
  AvailableSchedulesMetadata,
  CancelSchedule,
  ConfirmSchedule,
  CreatePatient,
  CreateSchedule,
  GetScheduleValue,
  IIntegratorService,
  InitialPatient,
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
      const metadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: 0,
      };

      // Validação: se não tem médico no filtro, retorna vazio
      if (!filter.doctor?.code) {
        return { schedules: [], metadata };
      }

      // Valida se o médico existe na base (padrão outras integrações)
      const doctorEntity = await this.entitiesService.getEntityByCode(
        filter.doctor.code,
        EntityType.doctor,
        integration._id,
      );

      if (!doctorEntity) {
        this.logger.warn(`Doctor entity not found: ${filter.doctor.code}`);
        return { schedules: [], metadata };
      }

      // Valida flows e filtros de idade (padrão Feegow/Amigo)
      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entities: [doctorEntity],
        entitiesFilter: filter,
        targetEntity: FlowSteps.doctor,
        filters: {
          patientBornDate: patient?.bornDate,
          patientSex: patient?.sex,
          patientCpf: patient?.cpf,
        },
      });

      if (!matchedDoctors?.length) {
        this.logger.warn(`Doctor ${filter.doctor.code} filtered out by flows`);
        return { schedules: [], metadata };
      }

      const schedules: RawAppointment[] = [];

      // Monta request para buscar horários disponíveis (Passo 2 da API)
      const request: KonsistAgendaHorarioRequest = {
        idmedico: Number(filter.doctor.code),
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
      const { appointments: processedAppointments, metadata: partialMetadata } =
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

      // Transforma em Appointment com entidades
      const validSchedules = await this.appointmentService.transformSchedules(integration, processedAppointments);

      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getAvailableSchedules', error);
    }
  }
  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, patient, doctor, insurance, procedure } = createSchedule;

      // Monta payload para pré-agendamento
      const payload: KonsistPreAgendamentoRequest = {
        origem: 1,
        chave: Number(appointment.code) || Number(appointment.data?.chave),
        idpaciente: Number(patient.code),
        idmedico: Number(doctor?.code),
        idconvenio: Number(insurance?.code),
        idservico: Number(procedure?.code),
        codigoprocedimento: String(procedure?.data?.codigo || procedure?.code || ''),
        descricaoprocedimento: procedure?.data?.name || '',
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
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // Busca agendamentos do paciente para validar o que será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, {
        patientCode: patient.code,
        patientCpf: patient.cpf,
      });

      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('KonsistService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      // Primeiro cria o novo agendamento
      const createdAppointment = await this.createSchedule(integration, {
        ...scheduleToCreate,
        appointment: {
          ...scheduleToCreate.appointment,
          appointmentDate: moment(scheduleToCreate.appointment.appointmentDate).format(),
        },
      });

      if (!createdAppointment?.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          { message: 'KonsistService.reschedule: error creating new schedule' },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      // Depois cancela o agendamento antigo
      const canceledOldAppointment = await this.cancelSchedule(integration, {
        appointmentCode: scheduleToCancelCode,
        patientCode: patient.code,
      });

      // Se falhou ao cancelar, tenta cancelar o novo que foi criado (rollback)
      if (!canceledOldAppointment.ok) {
        await this.cancelSchedule(integration, {
          appointmentCode: createdAppointment.appointmentCode,
          patientCode: patient.code,
        });

        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          { message: 'KonsistService.reschedule: error canceling old appointment' },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return createdAppointment;
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

  // ==================== ENTITY METHODS ====================

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
    fromImport?: boolean,
  ): Promise<EntityTypes[]> {
    return await this.konsistEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
    dateLimit?: number,
  ): Promise<EntityDocument[]> {
    return await this.konsistEntitiesService.listValidApiEntities({
      integration,
      targetEntity,
      filters: rawFilter,
      cache,
      patient,
    });
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }
}
