import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { DoctorEntityDocument, EntityDocument } from '../../../entities/schema';
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
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { ProdoctorApiService } from './prodoctor-api.service';
import { ProdoctorHelpersService } from './prodoctor-helpers.service';
import { ProdoctorEntitiesService } from './prodoctor-entities.service';
import {
  AgendamentoBuscarRequest,
  AgendamentoInserirRequest,
  HorariosDisponiveisRequest,
} from '../interfaces/schedule.interface';

@Injectable()
export class ProdoctorService implements IIntegratorService {
  private readonly logger = new Logger(ProdoctorService.name);
  private readonly dateFormat = 'DD/MM/YYYY';
  private readonly timeFormat = 'HH:mm';

  constructor(
    private readonly prodoctorApiService: ProdoctorApiService,
    private readonly prodoctorHelpersService: ProdoctorHelpersService,
    private readonly prodoctorEntitiesService: ProdoctorEntitiesService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  // ========== PATIENT METHODS ==========

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;

    try {
      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

      if (patientCache && cache) {
        return patientCache;
      }

      let patient: Patient;

      if (cpf) {
        patient = await this.getPatientByCpf(integration, cpf);
      } else if (code) {
        patient = await this.getPatientByCode(integration, code);
      }

      if (patient?.code) {
        await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      }

      return patient;
    } catch (error) {
      if (error?.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getPatient', error);
    }
  }

  private async getPatientByCode(integration: IntegrationDocument, code: string): Promise<Patient> {
    try {
      const response = await this.prodoctorApiService.getPatientDetails(integration, Number(code));

      if (!response?.sucesso || !response?.payload?.paciente) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return this.prodoctorHelpersService.transformPatient(response.payload.paciente);
    } catch (error) {
      if (error?.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getPatientByCode', error);
    }
  }

  private async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<Patient> {
    try {
      const response = await this.prodoctorApiService.getPatientByCpf(integration, cpf);

      if (!response?.sucesso || !response?.payload?.paciente?.codigo) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return this.prodoctorHelpersService.transformPatient(response.payload.paciente);
    } catch (error) {
      if (error?.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getPatientByCpf', error);
    }
  }

  public async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    try {
      const request = this.prodoctorHelpersService.buildCreatePatientRequest(patient);
      const response = await this.prodoctorApiService.createPatient(integration, request);

      if (!response?.sucesso || !response?.payload?.paciente) {
        throw INTERNAL_ERROR_THROWER('ProdoctorService.createPatient', {
          message: 'Failed to create patient',
          response,
        });
      }

      const createdPatient = this.prodoctorHelpersService.transformPatient(response.payload.paciente);

      await this.integrationCacheUtilsService.setPatientCache(
        integration,
        createdPatient.code,
        createdPatient.cpf,
        createdPatient,
      );

      return createdPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.createPatient', error);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    updatePatient: UpdatePatient,
  ): Promise<Patient> {
    try {
      const request = this.prodoctorHelpersService.buildUpdatePatientRequest(patientCode, updatePatient.patient);
      const response = await this.prodoctorApiService.updatePatient(integration, request);

      if (!response?.sucesso || !response?.payload?.paciente) {
        throw INTERNAL_ERROR_THROWER('ProdoctorService.updatePatient', {
          message: 'Failed to update patient',
          response,
        });
      }

      const updatedPatient = this.prodoctorHelpersService.transformPatient(response.payload.paciente);

      await this.integrationCacheUtilsService.setPatientCache(
        integration,
        updatedPatient.code,
        updatedPatient.cpf,
        updatedPatient,
      );

      return updatedPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.updatePatient', error);
    }
  }

  // ========== SCHEDULE METHODS ==========

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;

    try {
      const request: AgendamentoBuscarRequest = {
        paciente: { codigo: Number(patientCode) },
      };

      if (startDate && endDate) {
        request.periodo = {
          dataInicial: moment(startDate).format(this.dateFormat),
          dataFinal: moment(endDate).format(this.dateFormat),
        };
      }

      const response = await this.prodoctorApiService.buscarAgendamentosPaciente(integration, request);

      if (!response?.sucesso || !response?.payload?.agendamentos) {
        return [];
      }

      const rawSchedules: RawAppointment[] = response.payload.agendamentos.map((agendamento) =>
        this.prodoctorHelpersService.transformScheduleToRawAppointment(agendamento),
      );

      return await this.appointmentService.transformSchedules(integration, rawSchedules);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getPatientSchedules', error);
    }
  }

  public async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode, target } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const cachedSchedules = await this.integrationCacheUtilsService.getPatientSchedulesCache(
        integration,
        patientCode,
      );

      if (cachedSchedules?.minifiedSchedules) {
        return cachedSchedules.minifiedSchedules;
      }

      const request: AgendamentoBuscarRequest = {
        paciente: { codigo: Number(patientCode) },
      };

      const response = await this.prodoctorApiService.buscarAgendamentosPaciente(integration, request);

      if (!response?.sucesso || !response?.payload?.agendamentos) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });
        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        response.payload.agendamentos.map(async (agendamento) => {
          const rawAppointment = this.prodoctorHelpersService.transformScheduleToRawAppointment(agendamento);
          const [schedule] = await this.appointmentService.transformSchedules(integration, [rawAppointment]);

          const flowSteps = [FlowSteps.listPatientSchedules];
          if (target) {
            flowSteps.push(target);
          }

          const flowActions = await this.flowService.matchFlowsAndGetActions({
            integrationId: integration._id,
            targetFlowTypes: flowSteps,
            entitiesFilter: {
              appointmentType: schedule.appointmentType,
              doctor: schedule.doctor,
              insurance: schedule.insurance,
              insurancePlan: schedule.insurancePlan,
              organizationUnit: schedule.organizationUnit,
              speciality: schedule.speciality,
              procedure: schedule.procedure,
            },
          });

          minifiedSchedules.appointmentList.push({
            appointmentCode: schedule.appointmentCode,
            appointmentDate: schedule.appointmentDate,
            appointmentType: schedule.procedure?.specialityType,
            actions: flowActions,
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
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getMinifiedPatientSchedules', error);
    }
  }

  public async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, patient, doctor, insurance, organizationUnit, procedure, appointmentType } = createSchedule;
      const appointmentDate = moment.utc(appointment.appointmentDate);

      const request: AgendamentoInserirRequest = {
        paciente: { codigo: Number(patient.code) },
        usuario: { codigo: Number(doctor.code) },
        data: appointmentDate.format(this.dateFormat),
        hora: appointmentDate.format(this.timeFormat),
      };

      if (organizationUnit?.code) {
        request.localProDoctor = { codigo: Number(organizationUnit.code) };
      }

      if (insurance?.code) {
        request.convenio = { codigo: Number(insurance.code) };
      }

      if (appointmentType?.code) {
        request.tipoAgendamento = this.prodoctorHelpersService.buildTipoAgendamentoRequest(appointmentType.code);
      }

      if (procedure?.code) {
        const procedureEntity = await this.entitiesService.getEntityByCode(
          procedure.code,
          EntityType.procedure,
          integration._id,
        );
        const procedureData = procedureEntity?.data as any;
        if (procedureData?.tabela) {
          request.procedimentoMedico = {
            tabela: { codigo: procedureData.tabela.codigo },
            codigo: procedure.code,
          };
        }
      }

      if (appointment.duration) {
        request.duracao = Number(appointment.duration);
      }

      const response = await this.prodoctorApiService.inserirAgendamento(integration, request);

      if (!response?.sucesso || !response?.payload?.agendamento) {
        throw INTERNAL_ERROR_THROWER('ProdoctorService.createSchedule', {
          message: 'Failed to create schedule',
          response,
        });
      }

      // Busca entidades para montar o Appointment completo
      const doctorEntity = await this.entitiesService.getEntityByCode(doctor.code, EntityType.doctor, integration._id);

      const insuranceEntity = insurance?.code
        ? await this.entitiesService.getEntityByCode(insurance.code, EntityType.insurance, integration._id)
        : undefined;

      const organizationUnitEntity = organizationUnit?.code
        ? await this.entitiesService.getEntityByCode(
            organizationUnit.code,
            EntityType.organizationUnit,
            integration._id,
          )
        : undefined;

      return {
        appointmentCode: String(response.payload.agendamento.codigo),
        appointmentDate: appointmentDate.toISOString(),
        status: AppointmentStatus.scheduled,
        doctor: doctorEntity as DoctorEntityDocument,
        insurance: insuranceEntity as any,
        organizationUnit: organizationUnitEntity as any,
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.createSchedule', error);
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode } = cancelSchedule;

      const response = await this.prodoctorApiService.desmarcarAgendamento(integration, {
        agendamento: { codigo: Number(appointmentCode) },
      });

      if (response?.sucesso) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    try {
      const { appointmentCode } = confirmSchedule;

      const response = await this.prodoctorApiService.alterarStatusAgendamento(integration, {
        agendamento: { codigo: Number(appointmentCode) },
        estadoAgendaConsulta: {
          confirmado: true,
        },
      });

      if (response?.sucesso) {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.confirmSchedule', error);
    }
  }

  public async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    try {
      const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

      // Primeiro cancela o agendamento antigo
      await this.cancelSchedule(integration, {
        appointmentCode: scheduleToCancelCode,
        patientCode: patient.code,
      });

      // Depois cria o novo agendamento
      return await this.createSchedule(integration, scheduleToCreate);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.reschedule', error);
    }
  }

  // ========== AVAILABLE SCHEDULES ==========

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const { filter, fromDay = 0, untilDay = 30, period, patient } = availableSchedules;

      const metadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: 0,
      };

      // Precisa de um médico para buscar horários
      if (!filter.doctor?.code) {
        return { schedules: [], metadata: null };
      }

      const request: HorariosDisponiveisRequest = {
        usuario: { codigo: Number(filter.doctor.code) },
        periodo: {
          dataInicial: moment().add(fromDay, 'days').format(this.dateFormat),
          dataFinal: moment()
            .add(fromDay + untilDay, 'days')
            .format(this.dateFormat),
        },
      };

      if (filter.organizationUnit?.code) {
        request.localProDoctor = { codigo: Number(filter.organizationUnit.code) };
      }

      if (filter.insurance?.code) {
        request.convenio = { codigo: Number(filter.insurance.code) };
      }

      if (period?.start && period?.end) {
        request.turnos = this.prodoctorHelpersService.buildTurnosFromPeriod(period.start, period.end);
      }

      const response = await this.prodoctorApiService.buscarHorariosLivres(integration, request);

      if (!response?.sucesso || !response?.payload?.horarios) {
        return { schedules: [], metadata: null };
      }

      // Busca médico
      const doctorEntity = await this.entitiesService.getEntityByCode(
        filter.doctor.code,
        EntityType.doctor,
        integration._id,
      );

      if (!doctorEntity) {
        return { schedules: [], metadata: null };
      }

      const rawSchedules: RawAppointment[] = [];

      // Processa os horários disponíveis
      for (const horario of response.payload.horarios) {
        if (!horario.disponivel) continue;

        rawSchedules.push(
          this.prodoctorHelpersService.transformAvailableScheduleToRawAppointment(
            horario,
            doctorEntity as DoctorEntityDocument,
            filter,
          ),
        );
      }

      const schedules = await this.appointmentService.transformSchedules(integration, rawSchedules);

      // Aplica flow matching
      const [matchedSchedules] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entities: schedules as any,
        entitiesFilter: filter,
        targetEntity: FlowSteps.listAppointments,
        filters: { patientBornDate: patient?.bornDate },
      });

      return {
        schedules: orderBy(matchedSchedules as unknown as Appointment[], 'appointmentDate', 'asc'),
        metadata,
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getAvailableSchedules', error);
    }
  }

  // ========== ENTITY METHODS ==========

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
    fromImport?: boolean,
  ): Promise<EntityTypes[]> {
    return await this.prodoctorEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
    dateLimit?: number,
  ): Promise<EntityDocument[]> {
    return await this.prodoctorEntitiesService.listValidApiEntities({
      integration,
      targetEntity,
      filters: rawFilter,
      cache,
      patient,
    });
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  // ========== OTHER METHODS ==========

  public async getScheduleValue(
    integration: IntegrationDocument,
    scheduleValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    try {
      const { procedure, insurance } = scheduleValue;

      const cachedValue = await this.integrationCacheUtilsService.getScheduleValueCache(integration, {
        procedure: procedure?.code,
        insurance: insurance?.code,
      });

      if (cachedValue) {
        return cachedValue;
      }

      // ProDoctor não tem endpoint específico para valor, retorna valor padrão
      const scheduleValueResponse: AppointmentValue = {
        currency: 'BRL',
        value: 'A consultar',
      };

      await this.integrationCacheUtilsService.setScheduleValueCache(
        integration,
        { procedure: procedure?.code, insurance: insurance?.code },
        scheduleValueResponse,
      );

      return scheduleValueResponse;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getScheduleValue', error);
    }
  }

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      // Faz uma requisição simples para verificar status
      const response = await this.prodoctorApiService.listLocaisProDoctor(integration, { quantidade: 1 });
      return { ok: response?.sucesso === true };
    } catch (error) {
      return { ok: false };
    }
  }
}
