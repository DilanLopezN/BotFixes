import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { orderBy } from 'lodash';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { DoctorEntityDocument, EntityDocument, ProcedureEntityDocument, ScheduleType } from '../../../entities/schema';
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
import { ProdoctorApiService } from './prodoctor-api.service';
import { ProdoctorHelpersService } from './prodoctor-helpers.service';
import { ProdoctorEntitiesService } from './prodoctor-entities.service';

import { ProdoctorPatientSearchRequest, ProdoctorPatientSearchField } from '../interfaces/patient.interface';

import {
  SearchPatientAppointmentsRequest,
  InsertAppointmentRequest,
  CancelAppointmentRequest,
  UpdateAppointmentStateRequest,
  AvailableTimesRequest,
  AvailableTimesResponse,
} from '../interfaces/schedule.interface';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { EntitiesFiltersService } from '../../../../health/shared/entities-filters.service';

@Injectable()
export class ProdoctorService implements IIntegratorService {
  private readonly logger = new Logger(ProdoctorService.name);
  private readonly dateFormat = 'DD/MM/YYYY';
  private readonly timeFormat = 'HH:mm';
  private readonly dateTimeFormat = 'DD/MM/YYYY HH:mm';

  constructor(
    private readonly prodoctorApiService: ProdoctorApiService,
    private readonly prodoctorHelpersService: ProdoctorHelpersService,
    private readonly prodoctorEntitiesService: ProdoctorEntitiesService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly flowService: FlowService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
  ) {}

  // ========== STATUS ==========

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      //Tenta a rota de sexos (mais leve, sem parâmetros)
      try {
        const sexosResponse = await this.prodoctorApiService.getSexos(integration);
        if (sexosResponse?.sucesso === true && sexosResponse?.payload?.sexos?.length > 0) {
          return { ok: true };
        }
      } catch (error) {
        // Se falhar rota de sexos, tenta a próxima validação
      }

      // Fallback - tenta a rota de listagem de médicos
      try {
        const usersResponse = await this.prodoctorApiService.listUsers(integration, { quantidade: 1 });
        if (usersResponse?.sucesso === true) {
          return { ok: true };
        }
      } catch (error) {
        this.logger.debug('ProdoctorService.getStatus - getMedicalUsers failed');
      }

      // Se ambas falharem, retorna desconectado
      return { ok: false };
    } catch (error) {
      return { ok: false };
    }
  }

  // ========== PATIENT METHODS ==========

  async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
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

  private async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<Patient> {
    const request: ProdoctorPatientSearchRequest = {
      termo: cpf,
      campo: ProdoctorPatientSearchField.CPF,
      somenteAtivos: true,
    };

    const response = await this.prodoctorApiService.getPatient(integration, request);

    if (!response?.sucesso || !response?.payload?.pacientes?.length) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Patient not found', undefined, true);
    }

    return this.prodoctorHelpersService.replaceProdoctorPatientToPatient(response.payload.pacientes[0]);
  }

  private async getPatientByCode(integration: IntegrationDocument, code: string): Promise<Patient> {
    const response = await this.prodoctorApiService.getPatientDetails(integration, Number(code));

    if (!response?.sucesso || !response?.payload?.paciente) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Patient not found', undefined, true);
    }

    return this.prodoctorHelpersService.replaceProdoctorPatientToPatient(response.payload.paciente);
  }

  async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    try {
      const request = this.prodoctorHelpersService.replacePatientToProdoctorPatient(patient);
      const response = await this.prodoctorApiService.createPatient(integration, request);

      if (!response?.sucesso || !response?.payload?.paciente) {
        throw INTERNAL_ERROR_THROWER('ProdoctorService.createPatient', {
          message: 'Failed to create patient',
          response,
        });
      }

      const createdPatient = this.prodoctorHelpersService.replaceProdoctorPatientToPatient(response.payload.paciente);

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

  async updatePatient(
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

      const updatedPatient = this.prodoctorHelpersService.replaceProdoctorPatientToPatient(response.payload.paciente);

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

  async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;

    try {
      const request: SearchPatientAppointmentsRequest = {
        paciente: { codigo: Number(patientCode) },
      };

      if (startDate && endDate) {
        request.periodo = {
          dataInicial: moment(startDate).format(this.dateFormat),
          dataFinal: moment(endDate).format(this.dateFormat),
        };
      }

      const response = await this.prodoctorApiService.searchPatientAppointments(integration, request);

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

  async getMinifiedPatientSchedules(
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

      const request: SearchPatientAppointmentsRequest = {
        paciente: { codigo: Number(patientCode) },
      };

      const response = await this.prodoctorApiService.searchPatientAppointments(integration, request);

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

  async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    try {
      const { appointment, patient, doctor, insurance, organizationUnit, procedure, appointmentType } = createSchedule;
      const appointmentDate = moment.utc(appointment.appointmentDate);

      let procedimentoMedico: { tabela: { codigo: number }; codigo: string } | undefined;
      if (procedure?.code) {
        const procedureEntity = await this.entitiesService.getEntityByCode(
          procedure.code,
          EntityType.procedure,
          integration._id,
        );
        const procedureData = procedureEntity?.data as any;
        if (procedureData?.tabela) {
          procedimentoMedico = {
            tabela: { codigo: procedureData.tabela.codigo },
            codigo: procedure.code,
          };
        }
      }

      const request: InsertAppointmentRequest = {
        agendamento: {
          paciente: { codigo: Number(patient.code) },
          usuario: { codigo: Number(doctor.code) },
          data: appointmentDate.format(this.dateFormat),
          hora: appointmentDate.format(this.timeFormat),
          localProDoctor: organizationUnit?.code ? { codigo: Number(organizationUnit.code) } : undefined,
          convenio: insurance?.code ? { codigo: Number(insurance.code) } : undefined,
          tipoAgendamento: appointmentType?.code
            ? this.prodoctorHelpersService.buildTypeScheduleRequest(appointmentType.code)
            : undefined,
          procedimentoMedico,
          complemento: appointment.notes || undefined,
        },
        agendamentoAlertas: {
          suprimirAlertaLimiteConsultasPorUsuario: true,
          suprimirAlertaLimiteConsultasPorConvenio: true,
          suprimirAlertaBloqueioRetorno: true,
          suprimirAlertaValidadeCarteirinha: true,
          suprimirAlertaFeriado: true,
          suprimirAlertaPacienteInativo: true,
        },
        atualizaContatoPaciente: false,
      };

      const response = await this.prodoctorApiService.insertAppointment(integration, request);

      if (!response?.sucesso || !response?.payload?.agendamento) {
        throw INTERNAL_ERROR_THROWER('ProdoctorService.createSchedule', {
          message: 'Failed to create schedule',
          response,
        });
      }

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

      const agendamentoResponse = response.payload.agendamento;
      const appointmentCode = this.prodoctorHelpersService.buildAppointmentCode(agendamentoResponse);

      return {
        appointmentCode,
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

  async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode, patientCode } = cancelSchedule;
      const parts = appointmentCode.split('-');

      let request: CancelAppointmentRequest;

      if (parts.length === 4) {
        const [localProdoctorCode, usuarioCode, dataStr, horaStr] = parts;
        const data = `${dataStr.slice(0, 2)}/${dataStr.slice(2, 4)}/${dataStr.slice(4)}`;
        const hora = `${horaStr.slice(0, 2)}:${horaStr.slice(2)}`;

        request = {
          localProDoctor: { codigo: Number(localProdoctorCode) },
          usuario: { codigo: Number(usuarioCode) },
          data,
          hora,
        };
      } else {
        const schedules = await this.getPatientSchedules(integration, { patientCode });
        const schedule = schedules.find((s) => s.appointmentCode === appointmentCode);

        if (!schedule) {
          throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Appointment not found', undefined, true);
        }

        const scheduleDate = moment(schedule.appointmentDate);

        request = {
          localProDoctor: schedule.organizationUnit?.code
            ? { codigo: Number(schedule.organizationUnit.code) }
            : undefined,
          usuario: { codigo: Number(schedule.doctor?.code || 0) },
          data: scheduleDate.format(this.dateFormat),
          hora: scheduleDate.format(this.timeFormat),
        };
      }

      const response = await this.prodoctorApiService.cancelAppointment(integration, request);

      return { ok: response?.sucesso === true };
    } catch (error) {
      if (error?.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorService.cancelSchedule', error);
    }
  }

  async confirmSchedule(integration: IntegrationDocument, confirmSchedule: ConfirmSchedule): Promise<OkResponse> {
    try {
      const { appointmentCode, patientCode } = confirmSchedule;
      const parts = appointmentCode.split('-');

      let agendamentoID: {
        localProDoctor?: { codigo: number };
        usuario: { codigo: number };
        data: string;
        hora: string;
      };

      if (parts.length === 4) {
        const [localProdoctorCode, usuarioCode, dataStr, horaStr] = parts;
        const data = `${dataStr.slice(0, 2)}/${dataStr.slice(2, 4)}/${dataStr.slice(4)}`;
        const hora = `${horaStr.slice(0, 2)}:${horaStr.slice(2)}`;

        agendamentoID = {
          localProDoctor: { codigo: Number(localProdoctorCode) },
          usuario: { codigo: Number(usuarioCode) },
          data,
          hora,
        };
      } else {
        const schedules = await this.getPatientSchedules(integration, { patientCode });
        const schedule = schedules.find((s) => s.appointmentCode === appointmentCode);

        if (!schedule) {
          throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'Appointment not found', undefined, true);
        }

        const scheduleDate = moment(schedule.appointmentDate);

        agendamentoID = {
          localProDoctor: schedule.organizationUnit?.code
            ? { codigo: Number(schedule.organizationUnit.code) }
            : undefined,
          usuario: { codigo: Number(schedule.doctor?.code || 0) },
          data: scheduleDate.format(this.dateFormat),
          hora: scheduleDate.format(this.timeFormat),
        };
      }

      const request: UpdateAppointmentStateRequest = {
        agendamento: agendamentoID,
        alterarEstadoAgendaConsulta: {
          confirmado: true,
        },
      };

      const response = await this.prodoctorApiService.updateAppointmentState(integration, request);

      return { ok: response?.sucesso === true };
    } catch (error) {
      if (error?.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorService.confirmSchedule', error);
    }
  }

  public async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      //Busca agendamentos do paciente para validar qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, {
        patientCode: patient.code,
      });

      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode === scheduleToCancelCode,
      );

      // Valida se o agendamento a ser cancelado existe
      if (!appointmentToCancel) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ProdoctorService.reschedule: Invalid appointment code to cancel - appointment not found',
            appointmentCode: scheduleToCancelCode,
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      // Cria o novo agendamento enquanto o anterior permanece ativo
      const createdAppointment = await this.createSchedule(integration, scheduleToCreate);

      // Valida se o novo agendamento foi criado com sucesso
      if (!createdAppointment.appointmentCode) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ProdoctorService.reschedule: error creating new schedule - no appointment code returned',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      // Após criar novo agendamento com sucesso, cancela o anterior
      const cancelResult = await this.cancelSchedule(integration, {
        appointmentCode: scheduleToCancelCode,
        patientCode: patient.code,
      });

      // Se o cancelamento do agendamento anterior falhar, desfaz o novo agendamento
      if (!cancelResult.ok) {
        let rollbackFailed = false;
        let rollbackError: any = null;

        // Tenta cancelar o agendamento recém-criado para reverter a operação
        try {
          const rollbackResult = await this.cancelSchedule(integration, {
            appointmentCode: createdAppointment.appointmentCode,
            patientCode: patient.code,
          });

          if (!rollbackResult.ok) {
            rollbackFailed = true;
            rollbackError = new Error('Rollback returned ok: false');
          }
        } catch (error) {
          rollbackFailed = true;
          rollbackError = error;
        }

        // Se o rollback falhar, prioriza esse erro sobre o erro original
        if (rollbackFailed) {
          // Lança erro específico de corrupção de dados
          throw HTTP_ERROR_THROWER(
            HttpStatus.INTERNAL_SERVER_ERROR,
            {
              message: 'ProdoctorService.reschedule: CRITICAL - Data corruption detected',
              details: 'Failed to cancel old appointment and failed to rollback new appointment',
              oldAppointmentCode: scheduleToCancelCode,
              newAppointmentCode: createdAppointment.appointmentCode,
              patientCode: patient.code,
              action: 'Manual intervention required - patient has two active appointments',
            },
            HttpErrorOrigin.INTEGRATION_ERROR,
          );
        }

        // Se o rollback foi bem-sucedido, lança o erro original do cancelamento
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'ProdoctorService.reschedule: error canceling old appointment',
            details: 'New appointment was successfully rolled back',
            oldAppointmentCode: scheduleToCancelCode,
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      // ambas operações foram completadas
      return createdAppointment;
    } catch (error) {
      // Se o erro já é um HTTP_ERROR, propaga diretamente
      if (error?.status) {
        throw error;
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorService.reschedule', error);
    }
  }

  // ========== AVAILABLE SCHEDULES ==========

  async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    try {
      const {
        period,
        randomize,
        sortMethod = AppointmentSortMethod.default,
        filter,
        patient,
        limit,
        periodOfDay,
      } = availableSchedules;

      const { payload } = await this.createListAvailableSchedulesObject(integration, availableSchedules);

      const metadata: AvailableSchedulesMetadata = {
        interAppointmentPeriod: 0,
      };
      let response: AvailableTimesResponse = null;

      try {
        response = await this.prodoctorApiService.getAvailableSchedule(integration, payload);

        if (!response?.sucesso || !response?.payload?.agendamentos) {
          return { schedules: [], metadata };
        }
      } catch (error) {
        this.logger.error('ProdoctorService.getAvailableSchedulesResponseError', error);
        return { schedules: [], metadata };
      }

      const doctorsSet = new Set([]);
      response?.payload?.agendamentos.forEach((schedule) => doctorsSet.add(schedule?.usuario.codigo));

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

      for await (const schedule of response.payload.agendamentos || []) {
        const appointmentDate = moment(`${schedule.data} ${schedule.hora}`, this.dateTimeFormat);
        if (doctorsMap[schedule.usuario.codigo]) {
          const replacedAppointment: Appointment & { [key: string]: any } = {
            appointmentCode: filter.appointmentType.code,
            appointmentDate: appointmentDate.toISOString(),
            duration: '-1',
            procedureId: filter.procedure.code,
            doctorId: schedule.usuario.codigo,
            organizationUnitId: filter.organizationUnit?.code ?? '1',
            status: AppointmentStatus.scheduled,
          };

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
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getAvailableSchedules', error);
    }
  }

  // ========== SCHEDULE VALUE ==========

  public async getScheduleValue(
    integration: IntegrationDocument,
    scheduleValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    try {
      const { procedure } = scheduleValue;

      if (!procedure?.code) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          { message: 'procedure code is required' },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      // Buscar procedimento como ProcedureEntityDocument
      const procedureEntity = (await this.entitiesService.getEntityByCode(
        procedure.code,
        EntityType.procedure,
        integration._id,
      )) as ProcedureEntityDocument;

      if (!procedureEntity) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.NOT_FOUND,
          { message: 'procedure not found' },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      const procedureData = procedureEntity.data as {
        tabela?: { codigo?: number; nome?: string };
        honorario?: number;
      };

      const tabelaCodigo = procedureData?.tabela?.codigo;

      if (!tabelaCodigo) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          { message: 'procedure table code not found' },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }
      const resourceFilters = { procedure: procedure.code };
      const cachedValue = await this.integrationCacheUtilsService.getScheduleValueCache(integration, resourceFilters);

      if (cachedValue) {
        return cachedValue as AppointmentValue;
      }

      // 4. Buscar valor na API do ProDoctor
      const response = await this.prodoctorApiService.getProcedureDetails(integration, tabelaCodigo, procedure.code);

      // Validar resposta
      if (!response?.sucesso || !response?.payload?.procedimentoMedico) {
        return null;
      }

      const procedureResponse = response.payload.procedimentoMedico;

      // Se não tem valor ou é zero, retorna null
      if (!procedureResponse.valor || procedureResponse.valor <= 0) {
        return null;
      }

      // 5. Montar resposta
      const scheduleValueResponse: AppointmentValue = {
        currency: 'R$',
        value: formatCurrency(procedureResponse.valor),
      };

      // Salvar no cache
      await this.integrationCacheUtilsService.setScheduleValueCache(
        integration,
        resourceFilters,
        scheduleValueResponse,
      );

      return scheduleValueResponse;
    } catch (error) {
      if (error?.status) throw error;
      throw INTERNAL_ERROR_THROWER('ProdoctorService.getScheduleValue', error);
    }
  }

  // ========== ENTITY METHODS ==========

  async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
    fromImport?: boolean,
  ): Promise<EntityTypes[]> {
    return await this.prodoctorEntitiesService.extractEntity(integration, entityType, filter, cache);
  }

  async getEntityList(
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

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  private async createListAvailableSchedulesObject(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<{
    payload: AvailableTimesRequest;
  }> {
    const { filter, untilDay } = availableSchedules;
    let { fromDay } = availableSchedules;

    const payload: AvailableTimesRequest = {
      usuario: { codigo: Number(filter.doctor.code) },
      periodo: {
        dataInicial: moment().add(fromDay, 'days').format(this.dateFormat),
        dataFinal: moment()
          .add(fromDay + untilDay, 'days')
          .format(this.dateFormat),
      },
    };

    if (filter.organizationUnit?.code) {
      payload.localProDoctor = { codigo: Number(filter.organizationUnit.code) };
    }

    if (filter.speciality?.code) {
      payload.especialidade = { codigo: Number(filter.speciality.code) };
    }

    const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
      periodOfDay: availableSchedules.periodOfDay,
      limit: availableSchedules.limit,
      sortMethod: availableSchedules.sortMethod,
      randomize: availableSchedules.randomize,
      period: availableSchedules.period,
    });

    if (start && end) {
      payload.turnos = this.prodoctorHelpersService.buildShiftsFromPeriod(start, end);
    }

    return { payload };
  }
}
