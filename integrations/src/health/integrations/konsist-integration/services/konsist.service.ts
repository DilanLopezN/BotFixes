import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { HTTP_ERROR_THROWER, HttpErrorOrigin, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
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
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { KonsistApiService } from './konsist-api.service';
import { KonsistEntitiesService } from './konsist-entities.service';
import { KonsistHelpersService } from './konsist-helpers.service';
import {
  KonsistScheduleHourRequest as KonsistScheduleHourRequest,
  KonsistPreSchedulingRequest,
  KonsistSchedulePeriodRequest,
} from '../interfaces';
import { orderBy } from 'lodash';

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
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  // ==================== STATUS ====================

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      //rota mais leve apenas 4 unidades
      const units = await this.konsistApiService.listOrganizationUnits(integration);
      if (units?.length) {
        return { ok: true };
      }

      // Fallback: convênios
      const insurances = await this.konsistApiService.listInsurances(integration);
      return { ok: !!insurances?.length };
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

      return this.konsistHelpersService.replaceKonsistPatientToPatient(patientData[0]);
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
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'KonsistService.updatePatient: Not Implemented',
      undefined,
      true,
    );
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

      const request: KonsistScheduleHourRequest = {
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

      if (!availableSlots?.length) {
        return { schedules: [], metadata };
      }

      // Coleta códigos únicos de médicos dos slots
      const doctorsSet = new Set<string>();
      if (filter.doctor?.code) {
        doctorsSet.add(filter.doctor.code);
      } else {
        availableSlots.forEach((slot) => {
          if (slot.idmedico) {
            doctorsSet.add(String(slot.idmedico));
          }
        });
      }

      // Valida médicos no banco
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

      // Filtra apenas slots de médicos válidos
      for (const slot of availableSlots) {
        const doctorCode = String(slot.idmedico);
        if (doctorsMap[doctorCode]) {
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

      const payload: KonsistPreSchedulingRequest = {
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
      // Busca agendamentos do paciente para validar qual será cancelado
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode === scheduleToCancelCode,
      );

      // Valida se o agendamento a ser cancelado existe
      if (!appointmentToCancel) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'KonsistService.reschedule: Invalid appointment code to cancel - appointment not found',
            appointmentCode: scheduleToCancelCode,
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

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
    const { patientCode, patientCpf, startDate, endDate } = patientSchedules;

    try {
      const request: KonsistSchedulePeriodRequest = {
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
        if (!patientData.agendamento?.length) continue;

        for (const agendamento of patientData.agendamento) {
          rawAppointments.push(
            await this.konsistHelpersService.transformAppointment(agendamento, patientData, integration._id),
          );
        }
      }

      return await this.appointmentService.transformSchedules(integration, rawAppointments);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('KonsistService.getPatientSchedules', error);
    }
  }
  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode, patientCpf, startDate, endDate, target } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const request: KonsistSchedulePeriodRequest = {
        datai: startDate ? String(startDate) : moment().format('YYYY-MM-DD'),
        dataf: endDate ? String(endDate) : moment().add(90, 'days').format('YYYY-MM-DD'),
        cpfPaciente: patientCpf,
        idpaciente: patientCode ? Number(patientCode) : undefined,
      };

      const response = await this.konsistApiService.getAppointmentsByPeriod(integration, request);

      if (!response?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        response.flatMap((patientData) =>
          (patientData.agendamento || []).map(async (agendamento) => {
            const rawAppointment = await this.konsistHelpersService.transformAppointment(
              agendamento,
              patientData,
              integration._id,
            );
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
            });

            return {
              ...schedule,
              actions: flowActions,
            };
          }),
        ),
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
      throw INTERNAL_ERROR_THROWER('KonsistService.getMinifiedPatientSchedules', error);
    }
  }

  async getScheduleValue(
    _integration: IntegrationDocument,
    _scheduleValue: GetScheduleValue,
  ): Promise<AppointmentValue> {
    // não temos confirmação se a rota retorna os procedimentos com valor!
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'KonsistService.getScheduleValue: Not Implemented',
      undefined,
      true,
    );
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
