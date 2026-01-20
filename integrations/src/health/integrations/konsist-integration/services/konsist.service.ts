import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { EntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CancelSchedule } from '../../../integrator/interfaces/cancel-schedule.interface';
import { ConfirmSchedule } from '../../../integrator/interfaces/confirm-schedule.interface';
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
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
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
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { KonsistApiService } from './konsist-api.service';
import { KonsistEntitiesService } from './konsist-entities.service';
import { KonsistHelpersService } from './konsist-helpers.service';
import {
  KonsistAgendaHorarioRequest,
  KonsistPreAgendamentoRequest,
  KonsistPeriodoAgendamentoRequest,
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
      return { ok: !!insurances };
    } catch (error) {
      this.logger.error('KonsistService.getStatus', error);
      return { ok: false };
    }
  }

  // ==================== PATIENT ====================

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    try {
      if (!filters?.cpf && !filters?.code) return null;

      const searchParam: any = {};
      if (filters.cpf) searchParam.cpf = filters.cpf;
      if (filters.name) searchParam.nome = filters.name;

      const patientData = await this.konsistApiService.listPatients(integration, searchParam);

      if (!patientData?.length) return null;

      //@ts-ignore
      return this.konsistHelpersService.replacePatientWithContacts(patientData[0]);
    } catch (error) {
      this.logger.error('KonsistService.getPatient', error);
      return null;
    }
  }

  async createPatient(integration: IntegrationDocument, createPatient: CreatePatient): Promise<Patient> {
    try {
      const { patient } = createPatient;

      const payload = {
        nome: patient.name,
        cpf: patient.cpf,
        datanascimento: patient.bornDate ? moment(patient.bornDate).format('YYYY-MM-DD') : undefined,
        sexo: patient.sex || 'M',
        idconvenio: undefined,
        email: patient.email,
        telefone: patient.cellPhone
          ? {
              ddd: patient.cellPhone.substring(0, 2),
              numero: patient.cellPhone.substring(2),
            }
          : undefined,
      };

      const response = await this.konsistApiService.createPatient(integration, payload);

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
    _updatePatient: UpdatePatient,
  ): Promise<Patient> {
    // Konsist não tem endpoint de atualização de paciente
    const patient = await this.getPatient(integration, { code: patientCode });
    return patient;
  }

  // ==================== SCHEDULES ====================

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
      const metadata: AvailableSchedulesMetadata = {};

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

      const validSchedules = await this.appointmentService.transformSchedules(integration, processedAppointments);

      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getAvailableSchedules', error);
    }
  }

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, patient, doctor, insurance, procedure } = createSchedule;

      const payload: KonsistPreAgendamentoRequest = {
        origem: 1,
        chave: Number(appointment.code) || Number(appointment.data?.chave),
        idpaciente: Number(patient.code),
        idmedico: Number(doctor?.code),
        idconvenio: Number(insurance?.code),
        idservico: Number(procedure?.code),
        codigoprocedimento: procedure?.code || '',
        descricaoprocedimento: procedure?.data?.nome || 'Consulta',
        observacao: appointment.notes || '',
      };

      const response = await this.konsistApiService.createPreSchedule(integration, payload);

      return {
        appointmentCode: String(response?.protocolo || appointment.code),
        appointmentDate: appointment.appointmentDate,
        status: AppointmentStatus.scheduled,
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.createSchedule', error);
    }
  }

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode } = cancelSchedule;

    try {
      await this.konsistApiService.updateAppointmentStatus(integration, {
        chave: Number(appointmentCode),
        status: 2, // 2 = Desmarcado
      });

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.cancelSchedule', error);
    }
  }

  async confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    const { appointmentCode } = confirmSchedule;

    try {
      await this.konsistApiService.updateAppointmentStatus(integration, {
        chave: Number(appointmentCode),
        status: 1, // 1 = Confirmado
      });

      return { ok: true };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.confirmSchedule', error);
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      // Cria novo agendamento primeiro
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
        datai: startDate ? moment(startDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
        dataf: endDate ? moment(endDate).format('YYYY-MM-DD') : moment().add(90, 'days').format('YYYY-MM-DD'),
        cpfPaciente: patientCpf,
        idpaciente: patientCode ? Number(patientCode) : undefined,
      };

      const response = await this.konsistApiService.listAppointments(integration, request);

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
            [EntityType.appointmentType]: schedule.appointmentType,
            [EntityType.doctor]: schedule.doctor,
            [EntityType.procedure]: schedule.procedure,
            [EntityType.insurance]: schedule.insurance,
            [EntityType.insurancePlan]: schedule.insurancePlan,
            [EntityType.organizationUnit]: schedule.organizationUnit,
            [EntityType.speciality]: schedule.speciality,
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
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const schedules = await this.getPatientSchedules(integration, patientSchedules);

      if (!schedules?.length) return minifiedSchedules;

      const now = moment();
      const pastSchedules = schedules.filter((s) => moment(s.appointmentDate).isBefore(now));
      const futureSchedules = schedules.filter((s) => moment(s.appointmentDate).isSameOrAfter(now));

      minifiedSchedules.appointmentList = schedules.map((s) => ({
        appointmentCode: s.appointmentCode,
        appointmentDate: s.appointmentDate,
        appointmentType: s.appointmentType?.code,
        actions: s.actions,
      }));

      if (pastSchedules.length) {
        minifiedSchedules.lastAppointment = pastSchedules[pastSchedules.length - 1];
      }

      if (futureSchedules.length) {
        minifiedSchedules.nextAppointment = futureSchedules[0];
      }

      return minifiedSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getMinifiedPatientSchedules', error);
    }
  }

  async getScheduleValue(
    _integration: IntegrationDocument,
    _scheduleValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    return {
      value: 'Consulte a clínica',
      currency: 'R$',
    };
  }

  // ==================== ENTITY METHODS - IGUAL AO PRODOCTOR ====================

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
    _fromImport?: boolean,
  ): Promise<EntityTypes[]> {
    return await this.konsistEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
    _dateLimit?: number,
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
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }
}
